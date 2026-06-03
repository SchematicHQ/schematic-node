import type { RedisClient } from "../cache/redis";

import type { ILeaseStore } from "./lease-store";
import type { IReservationStore } from "./reservation-store";
import type { Reservation } from "./types";

const DEFAULT_KEY_PREFIX = "schematic:";
const RES_KEY_NAMESPACE = "credit-reservation:";
// Sorted set scoring open reservations by `expiresAt` so the sweeper can pop
// expired entries in O(log n). Members encode the full (company, credit, id)
// tuple — see `encodeMember` for why.
const RES_INDEX_KEY = "credit-reservations:byExpiry";
// Per-(company, credit) index of open reservations, stored as a single hash
// of `reservationId -> creditsReserved`. `reservedCredits` then reads the whole
// tenant's holds with ONE `HGETALL` (single key, Cluster-safe) and sums the
// values, instead of fanning out a per-reservation read. The hash also *is* the
// source of truth for the sum: a field exists iff its reservation is open and
// unrefunded (consume removes the field and refunds in the same call), so the
// sum stays exact without cross-checking the reservation hashes.
const RES_BYCREDIT_NAMESPACE = "credit-reservations:byCredit:";
// Buffer past `expiresAt` before Redis auto-evicts the row, so the sweeper
// has a window to refund.
const RES_TTL_GRACE_MS = 30_000;

/**
 * Atomic claim: read the reservation hash and delete it in one step, returning
 * its fields (or `nil` if it was already gone). Touches a single key, so it's
 * safe under Redis Cluster. The atomic read-then-delete is what makes
 * `consume` exactly-once: of two racing callers (a normal Track and a sweeper,
 * say) only one gets the fields back and proceeds to refund — the other sees
 * `nil`. The refund to the lease hash is a separate single-key op; a crash in
 * the gap leaves the unspent slice held on the lease until the lease itself
 * expires, never double-refunded.
 */
const CLAIM_SCRIPT = `
local raw = redis.call('HGETALL', KEYS[1])
if #raw == 0 then return nil end
redis.call('DEL', KEYS[1])
return raw
`;

// `byExpiry` zset members encode the (company, credit, id) tuple so the sweeper
// can clean the per-tenant `byCredit` hash even after the reservation hash has
// TTL-evicted (at which point CLAIM returns nil and can't report company/credit);
// otherwise the orphaned field would permanently inflate `reservedCredits`.
// The delimiter `|` is absent from Schematic ids and the UUID reservation id.
function encodeMember(r: { companyId: string; creditTypeId: string; id: string }): string {
    return `${r.companyId}|${r.creditTypeId}|${r.id}`;
}

// Returns undefined for a member that doesn't parse (shouldn't happen — only
// `add` writes members); the sweeper drops such a member so it can't wedge
// the sweep loop.
function decodeMember(member: string): { companyId: string; creditTypeId: string; id: string } | undefined {
    const parts = member.split("|");
    if (parts.length !== 3) return undefined;
    return { companyId: parts[0], creditTypeId: parts[1], id: parts[2] };
}

// Page size for the sweeper's ZRANGEBYSCORE. Without a LIMIT, a backlog of
// expired holds (e.g. after a Redis outage or a long pod pause) would come
// back as one giant reply on every pod's next tick; paging bounds the reply
// while the per-member zRem keeps `offset: 0` advancing through the backlog.
const SWEEP_BATCH_SIZE = 256;
// Upper bound on pages per tick — keeps a single sweep's work bounded and
// guards against an endless loop if zRem persistently fails (the member would
// otherwise be re-read forever). Anything left over is picked up next tick.
const MAX_SWEEP_BATCHES = 16;

/**
 * Redis-backed reservation table. Each reservation is a hash, indexed by
 * `expiresAt` in a sorted set so the sweeper can pop expired entries in
 * O(log n), and by `(company, credit)` so the balance display can sum a
 * tenant's open holds. All mutations use single-key operations (or single-key
 * Lua), so the store is correct on standalone and clustered Redis alike — the
 * unspent-slice refund is delegated to the lease store rather than reaching
 * across to the lease hash inside a multi-key script.
 */
export class RedisReservationStore implements IReservationStore {
    private readonly client: RedisClient;
    private readonly leaseStore: ILeaseStore;
    private readonly sweepIntervalMs: number;
    private readonly keyPrefix: string;
    private sweepInterval: NodeJS.Timeout | null = null;
    private stopped = false;

    constructor(opts: {
        client: RedisClient;
        leaseStore: ILeaseStore;
        sweepIntervalMs?: number;
        keyPrefix?: string;
    }) {
        this.client = opts.client;
        this.leaseStore = opts.leaseStore;
        this.sweepIntervalMs = opts.sweepIntervalMs ?? 1000;
        this.keyPrefix = opts.keyPrefix ?? DEFAULT_KEY_PREFIX;
    }

    private hashKey(id: string): string {
        return `${this.keyPrefix}${RES_KEY_NAMESPACE}${id}`;
    }

    private indexKey(): string {
        return `${this.keyPrefix}${RES_INDEX_KEY}`;
    }

    private byCreditKey(companyId: string, creditTypeId: string): string {
        return `${this.keyPrefix}${RES_BYCREDIT_NAMESPACE}${companyId}:${creditTypeId}`;
    }

    async add(reservation: Reservation): Promise<void> {
        const expiresMs = reservation.expiresAt.getTime();
        const hashKey = this.hashKey(reservation.id);
        // Write the hash first so the reservation exists before anything
        // references it. These are independent single-key ops rather than one
        // multi-key script: a partial failure at worst leaves an un-indexed
        // reservation that the TTL reaps (its slice reclaimed when the lease
        // expires), never a double-spend.
        await this.client.hSet(hashKey, {
            id: reservation.id,
            leaseId: reservation.leaseId,
            companyId: reservation.companyId,
            creditTypeId: reservation.creditTypeId,
            eventSubtype: reservation.eventSubtype,
            quantityReserved: String(reservation.quantityReserved),
            creditsReserved: String(reservation.creditsReserved),
            consumptionRate: String(reservation.consumptionRate),
            expiresAt: String(expiresMs),
            evalCtx: JSON.stringify(reservation.evalCtx),
        });
        // The TTL and the two indexes (expiry zset for the sweeper, per-tenant
        // hash for `reservedCredits`) only depend on the hash existing — not on
        // each other — so they go out concurrently: one round-trip wave instead
        // of three. This sits on every allowed check, so the latency matters.
        await Promise.all([
            this.client.pExpireAt(hashKey, expiresMs + RES_TTL_GRACE_MS),
            this.client.zAdd(this.indexKey(), { score: expiresMs, value: encodeMember(reservation) }),
            this.client.hSet(
                this.byCreditKey(reservation.companyId, reservation.creditTypeId),
                reservation.id,
                String(reservation.creditsReserved),
            ),
        ]);
    }

    async get(id: string): Promise<Reservation | undefined> {
        const raw = await this.client.hGetAll(this.hashKey(id));
        if (!raw || !raw.id) return undefined;
        return decodeReservation(raw);
    }

    /**
     * Sum open reservations for a (company, credit) with a single `HGETALL` on
     * the per-tenant index hash — one round trip, one key (Cluster-safe), no
     * per-reservation fan-out. The hash values are the authoritative
     * `creditsReserved` figures; a field is present iff its reservation is open
     * and unrefunded (consume removes the field and refunds in the same call),
     * so summing them is exact. Display-path call, not a hot path.
     */
    async reservedCredits(companyId: string, creditTypeId: string): Promise<number> {
        const byCredit = await this.client.hGetAll(this.byCreditKey(companyId, creditTypeId)).catch(() => ({}));
        let total = 0;
        for (const value of Object.values(byCredit)) {
            total += Number(value) || 0;
        }
        return total;
    }

    async consume(id: string, creditsConsumed: number): Promise<number | null> {
        // Atomically claim (read + delete) the reservation hash. Only one caller
        // wins; a duplicate/racing consume gets nil and returns null.
        const claimed = await this.client.eval(CLAIM_SCRIPT, {
            keys: [this.hashKey(id)],
            arguments: [],
        });
        const raw = decodeRawArray(claimed);
        if (!raw || !raw.id) return null;

        const companyId = raw.companyId;
        const creditTypeId = raw.creditTypeId;
        const reserved = Number(raw.creditsReserved) || 0;

        // Index cleanup — single-key ops. Drop the credits from the per-tenant
        // hash BEFORE the refund below so the lease (localRemaining + this hash)
        // never transiently double-counts the slice: while it sits on the hash
        // it's "reserved", and the refund moves it back to localRemaining.
        await this.client.zRem(this.indexKey(), encodeMember({ companyId, creditTypeId, id })).catch(() => {});
        await this.client.hDel(this.byCreditKey(companyId, creditTypeId), id).catch(() => {});

        let consumed = creditsConsumed;
        if (consumed < 0) consumed = 0;
        if (consumed > reserved) consumed = reserved;
        const refund = reserved - consumed;
        if (refund > 0) {
            // Delegate the clamped refund to the lease store, which owns the
            // lease hash. Keeps the cross-key write out of a single Lua script.
            // Pinned to the reservation's leaseId so a hold carved out of an
            // expired lease can't inflate a successor lease's balance.
            await this.leaseStore.refund(companyId, creditTypeId, refund, raw.leaseId);
        }
        return consumed;
    }

    startSweep(): void {
        if (this.sweepInterval || this.stopped) return;
        this.sweepInterval = setInterval(() => {
            this.sweepExpired().catch(() => {
                // Swallow so the timer keeps running.
            });
        }, this.sweepIntervalMs);
        if (this.sweepInterval.unref) this.sweepInterval.unref();
    }

    async sweepExpired(now: Date = new Date()): Promise<number> {
        const cutoff = now.getTime();
        let swept = 0;
        // Page through expired members (encoded `company|credit|id`, scored by
        // expiresAt) rather than fetching them all at once. Each processed
        // member is zRem'd below, so re-reading at `offset: 0` advances through
        // the backlog; MAX_SWEEP_BATCHES bounds the work per tick.
        for (let batch = 0; batch < MAX_SWEEP_BATCHES; batch++) {
            const expired = await this.client.zRangeByScore(this.indexKey(), 0, cutoff, {
                LIMIT: { offset: 0, count: SWEEP_BATCH_SIZE },
            });
            if (expired.length === 0) break;
            for (const member of expired) {
                const decoded = decodeMember(member);
                if (!decoded) {
                    // Unparseable member (nothing but `add` writes these, so
                    // this is belt-and-braces) — drop it so it can't wedge the
                    // sweeper.
                    await this.client.zRem(this.indexKey(), member).catch(() => {});
                    continue;
                }
                const refunded = await this.consume(decoded.id, 0);
                // Always drop the member we read. On the success path `consume`
                // already removed it (so this is an idempotent no-op); it also
                // covers the hash-evicted path below.
                await this.client.zRem(this.indexKey(), member).catch(() => {});
                if (refunded !== null) {
                    swept++;
                    continue;
                }
                // `consume` found no reservation hash. Either a racing track already
                // consumed it (and reconciled the `byCredit` field — the hDel below is
                // then a no-op), or the hash TTL-evicted before the sweeper reached it,
                // orphaning the `byCredit` field. Reconcile it so `reservedCredits`
                // can't keep summing an evicted hold. We do NOT refund the unspent
                // slice here: without the hash, CLAIM can't arbitrate exactly-once
                // across racing sweepers, so the slice is reclaimed when the lease
                // itself expires server-side instead.
                await this.client
                    .hDel(this.byCreditKey(decoded.companyId, decoded.creditTypeId), decoded.id)
                    .catch(() => {});
            }
            if (expired.length < SWEEP_BATCH_SIZE) break;
        }
        return swept;
    }

    stop(): void {
        this.stopped = true;
        if (this.sweepInterval) {
            clearInterval(this.sweepInterval);
            this.sweepInterval = null;
        }
    }

    async size(): Promise<number> {
        return this.client.zCard(this.indexKey()).catch(() => 0);
    }
}

/** Decode a flat `[field, value, field, value, ...]` HGETALL array (as CLAIM_SCRIPT returns). */
function decodeRawArray(raw: unknown): Record<string, string> | undefined {
    if (!Array.isArray(raw) || raw.length === 0) return undefined;
    const out: Record<string, string> = {};
    for (let i = 0; i + 1 < raw.length; i += 2) {
        out[String(raw[i])] = String(raw[i + 1]);
    }
    return out;
}

function decodeReservation(raw: Record<string, string>): Reservation {
    return {
        id: raw.id,
        leaseId: raw.leaseId,
        companyId: raw.companyId,
        creditTypeId: raw.creditTypeId,
        eventSubtype: raw.eventSubtype,
        quantityReserved: Number(raw.quantityReserved),
        creditsReserved: Number(raw.creditsReserved),
        consumptionRate: Number(raw.consumptionRate),
        expiresAt: new Date(Number(raw.expiresAt)),
        evalCtx: raw.evalCtx ? JSON.parse(raw.evalCtx) : {},
    };
}
