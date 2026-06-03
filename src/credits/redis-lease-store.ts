import type { RedisClient } from "../cache/redis";

import { type ILeaseStore, type LeaseEntry, leaseKey } from "./lease-store";
import { DEFAULT_LEASE_DURATION_MS } from "./types";

const DEFAULT_KEY_PREFIX = "schematic:";
const LEASE_KEY_NAMESPACE = "credit-lease:";
// How long after the declared expiry to keep the Redis row around before
// auto-eviction. Gives the sweeper a window to refund expired reservations
// before the underlying lease state disappears.
const LEASE_TTL_GRACE_MS = 60_000;

// Every Lua script below touches exactly ONE key (the lease hash), keeping
// them safe under Redis Cluster (multi-key scripts spanning slots raise
// CROSSSLOT). Only the lease hash needs atomic mutation; cross-key
// bookkeeping uses ordinary single-key commands.
//
// Expiry is decided against the *Redis server's* clock (`redis.call('TIME')`),
// not the calling pod's `Date.now()`: with many pods sharing one lease, local
// clock skew would let pods disagree on whether the lease is live. The
// `LEASE_NOW_MS` snippet converts TIME to integer milliseconds (matching the
// stored `expiresAt`); `redis.replicate_commands()` first, so the
// non-deterministic TIME read is allowed alongside writes on Redis 5/6.
const LEASE_NOW_MS = `
redis.replicate_commands()
local t = redis.call('TIME')
local now = (tonumber(t[1]) * 1000) + math.floor(tonumber(t[2]) / 1000)
`;

/**
 * Atomic `replace`. Writes the lease hash only when the slot is empty or the
 * existing lease has expired. Returns "1" on write, "0" if a *live* lease
 * already occupies the slot — even one with a different `leaseId`, e.g.
 * installed by a sibling instance that raced this acquire. Keeping the existing
 * live lease preserves its already-debited `localRemainingCredits`; the caller
 * should release the lease it acquired only if its ID differs from the
 * installed one (see `CreditLeaseManager.acquire`). `now` is the Redis server
 * clock (see `LEASE_NOW_MS`).
 */
const REPLACE_SCRIPT =
    LEASE_NOW_MS +
    `
local existing_id = redis.call('HGET', KEYS[1], 'leaseId')
local existing_expiry = tonumber(redis.call('HGET', KEYS[1], 'expiresAt') or '0')
local new_id = ARGV[1]
local new_granted = ARGV[2]
local new_expiry = tonumber(ARGV[3])
local grace = tonumber(ARGV[4])

if existing_id and existing_expiry > now then
    return 0
end

redis.call('DEL', KEYS[1])
redis.call('HSET', KEYS[1],
    'leaseId', new_id,
    'companyId', ARGV[5],
    'creditTypeId', ARGV[6],
    'grantedAmount', new_granted,
    'localRemainingCredits', new_granted,
    'expiresAt', ARGV[3])
redis.call('PEXPIREAT', KEYS[1], new_expiry + grace)
return 1
`;

/**
 * Atomic check-and-decrement on `localRemainingCredits`. Returns the
 * post-debit balance (as a string — a Lua number reply truncates to integer,
 * which would corrupt fractional credit costs) on success; `false` (a nil
 * reply) if there's no lease, the lease has expired, or there's insufficient
 * remaining. Returning the balance saves the caller a follow-up read when it
 * needs the pre-debit figure. The expiry guard compares against the Redis
 * server clock (`now`, see `LEASE_NOW_MS`) so a reserve against an
 * expired-but-not-yet-evicted row during the TTL grace window is rejected —
 * the server treats an expired lease as released, so its balance is stale.
 */
const TRY_RESERVE_SCRIPT =
    LEASE_NOW_MS +
    `
local raw = redis.call('HGET', KEYS[1], 'localRemainingCredits')
if not raw then return false end
local expiry = tonumber(redis.call('HGET', KEYS[1], 'expiresAt') or '0')
if expiry <= now then return false end
local remaining = tonumber(raw)
local requested = tonumber(ARGV[1])
if remaining < requested then return false end
local new_remaining = remaining - requested
redis.call('HSET', KEYS[1], 'localRemainingCredits', tostring(new_remaining))
return tostring(new_remaining)
`;

/**
 * Refund credits, clamped at `grantedAmount`. ARGV[2], when non-empty, pins
 * the refund to a specific `leaseId`: if the slot now holds a different lease
 * (the original expired and a successor was installed), the refund is dropped
 * — the expired lease's unspent remainder was already returned to the company
 * balance server-side, so crediting the successor would mint phantom credits.
 */
const REFUND_SCRIPT = `
local raw_remaining = redis.call('HGET', KEYS[1], 'localRemainingCredits')
if not raw_remaining then return 0 end
local required_lease = ARGV[2]
if required_lease and required_lease ~= '' then
    local current_lease = redis.call('HGET', KEYS[1], 'leaseId')
    if current_lease ~= required_lease then return 0 end
end
local remaining = tonumber(raw_remaining)
local granted = tonumber(redis.call('HGET', KEYS[1], 'grantedAmount') or '0')
local refund = tonumber(ARGV[1])
local new_balance = remaining + refund
if new_balance > granted then new_balance = granted end
redis.call('HSET', KEYS[1], 'localRemainingCredits', tostring(new_balance))
return 1
`;

/**
 * Reconcile the lease to the server-authoritative grantedAmount total
 * (ARGV[1]), crediting the difference to localRemainingCredits. The delta is
 * computed HERE, atomically against the hash's current total — never by the
 * caller from a pre-wire-call read: per-process single-flight doesn't cover
 * sibling pods, so two pods extending the same shared lease concurrently
 * would each apply a delta against the same stale read and mint phantom
 * credits. Reconciling to the absolute total converges regardless of arrival
 * order (a total a sibling already applied lands as `add <= 0`, a no-op).
 * Expiry only ever moves forward, so an out-of-order apply can't shorten a
 * lease a sibling just extended. ARGV[4], when non-empty, pins the extend to
 * a specific `leaseId`: the server granted the extension to that lease, so if
 * the slot now holds a successor (the original expired mid-extend and a
 * racing acquire replaced it), the extend is dropped — crediting the
 * successor would mint credits locally that the server attributes to the
 * expired lease. Mirrors the pin on REFUND_SCRIPT.
 */
const EXTEND_SCRIPT = `
local raw_granted = redis.call('HGET', KEYS[1], 'grantedAmount')
if not raw_granted then return 0 end
local required_lease = ARGV[4]
if required_lease and required_lease ~= '' then
    local current_lease = redis.call('HGET', KEYS[1], 'leaseId')
    if current_lease ~= required_lease then return 0 end
end
local granted = tonumber(raw_granted)
local target = tonumber(ARGV[1])
local add = target - granted
if add > 0 then
    local remaining = tonumber(redis.call('HGET', KEYS[1], 'localRemainingCredits') or '0')
    redis.call('HSET', KEYS[1],
        'grantedAmount', tostring(target),
        'localRemainingCredits', tostring(remaining + add))
end
local new_expiry = tonumber(ARGV[2])
local grace = tonumber(ARGV[3])
local current_expiry = tonumber(redis.call('HGET', KEYS[1], 'expiresAt') or '0')
if new_expiry > current_expiry then
    redis.call('HSET', KEYS[1], 'expiresAt', ARGV[2])
    redis.call('PEXPIREAT', KEYS[1], new_expiry + grace)
end
return 1
`;

/**
 * Redis-backed lease store. One hash per `(companyId, creditTypeId)` slot, with
 * atomic mutations via single-key Lua scripts so it stays correct on both
 * standalone and clustered Redis.
 */
export class RedisLeaseStore implements ILeaseStore {
    private readonly client: RedisClient;
    private readonly keyPrefix: string;
    private readonly defaultLeaseDurationMs: number;

    constructor(opts: {
        client: RedisClient;
        keyPrefix?: string;
        /**
         * Defensive fallback used by `extend()` when the caller doesn't supply
         * `newExpiresAt`. The lease manager always passes one today, so this
         * only matters for direct callers. Default `DEFAULT_LEASE_DURATION_MS`.
         */
        defaultLeaseDurationMs?: number;
    }) {
        this.client = opts.client;
        this.keyPrefix = opts.keyPrefix ?? DEFAULT_KEY_PREFIX;
        this.defaultLeaseDurationMs = opts.defaultLeaseDurationMs ?? DEFAULT_LEASE_DURATION_MS;
    }

    /** Public so the reservation store can target the same lease hash for refunds. */
    hashKey(companyId: string, creditTypeId: string): string {
        return `${this.keyPrefix}${LEASE_KEY_NAMESPACE}${leaseKey(companyId, creditTypeId)}`;
    }

    async get(companyId: string, creditTypeId: string): Promise<LeaseEntry | undefined> {
        const raw = await this.client.hGetAll(this.hashKey(companyId, creditTypeId));
        if (!raw || !raw.leaseId) return undefined;
        return decodeEntry(raw);
    }

    async replace(entry: Omit<LeaseEntry, "localRemainingCredits">): Promise<boolean> {
        const result = await this.client.eval(REPLACE_SCRIPT, {
            keys: [this.hashKey(entry.companyId, entry.creditTypeId)],
            // No client clock here — the script reads `now` from the Redis
            // server via TIME (see LEASE_NOW_MS) so all pods agree on expiry.
            arguments: [
                entry.leaseId,
                String(entry.grantedAmount),
                String(entry.expiresAt.getTime()),
                String(LEASE_TTL_GRACE_MS),
                entry.companyId,
                entry.creditTypeId,
            ],
        });
        return Number(result) === 1;
    }

    async extend(
        companyId: string,
        creditTypeId: string,
        grantedAmount: number,
        newExpiresAt?: Date,
        leaseId?: string,
    ): Promise<void> {
        const expiry = (newExpiresAt ?? new Date(Date.now() + this.defaultLeaseDurationMs)).getTime();
        await this.client.eval(EXTEND_SCRIPT, {
            keys: [this.hashKey(companyId, creditTypeId)],
            // grantedAmount is the server-authoritative TOTAL; the script
            // computes the credit delta atomically against the stored total.
            // Empty string disables the lease pin (Lua has no nil ARGV).
            arguments: [String(grantedAmount), String(expiry), String(LEASE_TTL_GRACE_MS), leaseId ?? ""],
        });
    }

    async drop(companyId: string, creditTypeId: string): Promise<void> {
        // A plain single-key delete — no secondary index to keep in sync.
        await this.client.del(this.hashKey(companyId, creditTypeId));
    }

    async tryReserve(companyId: string, creditTypeId: string, credits: number): Promise<number | null> {
        // Reject non-finite/negative debits before they reach the script:
        // `String(NaN)` parses back to `nan` in Lua (strtod), slips through the
        // `<` comparison, and would poison the SHARED balance for every pod.
        if (!Number.isFinite(credits) || credits < 0) return null;
        const result = await this.client.eval(TRY_RESERVE_SCRIPT, {
            keys: [this.hashKey(companyId, creditTypeId)],
            // Only the requested amount — `now` comes from the Redis server clock.
            arguments: [String(credits)],
        });
        // nil reply (could not reserve) surfaces as null; success is the
        // post-debit balance as a string.
        if (result === null || result === undefined) return null;
        return Number(result);
    }

    async refund(companyId: string, creditTypeId: string, credits: number, leaseId?: string): Promise<void> {
        if (credits <= 0) return;
        await this.client.eval(REFUND_SCRIPT, {
            keys: [this.hashKey(companyId, creditTypeId)],
            // Empty string disables the lease pin (Lua has no nil ARGV).
            arguments: [String(credits), leaseId ?? ""],
        });
    }
}

function decodeEntry(raw: Record<string, string>): LeaseEntry {
    return {
        leaseId: raw.leaseId,
        companyId: raw.companyId,
        creditTypeId: raw.creditTypeId,
        grantedAmount: Number(raw.grantedAmount ?? "0"),
        localRemainingCredits: Number(raw.localRemainingCredits ?? "0"),
        expiresAt: new Date(Number(raw.expiresAt ?? "0")),
    };
}
