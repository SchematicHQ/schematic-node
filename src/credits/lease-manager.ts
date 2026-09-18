import { randomUUID } from "crypto";

import type * as api from "../api";
import type { CreditsClient } from "../api/resources/credits/client/Client";
import type { Logger } from "../logger";

import { type ILeaseStore, type LeaseEntry, leaseKey } from "./lease-store";
import {
    DEFAULT_LEASE_DURATION_MS,
    DEFAULT_LEASE_SIZE,
    DEFAULT_LOW_WATER_MARK,
    DEFAULT_RESERVATION_TTL_MS,
    SHUTDOWN_DRAIN_TIMEOUT_MS,
    type CreditLeaseConfig,
    type ResolvedLeaseConfig,
} from "./types";

/** Drop a timer's hold on the event loop where the runtime has one (Node). */
export function unrefTimer(timer: ReturnType<typeof setTimeout>): void {
    if (timer.unref) timer.unref();
}

/**
 * Await `promises`, giving up after `timeoutMs`. Reports whether everything
 * landed, so a caller winding down can say what it is abandoning. Abandoned
 * work is not cancelled — promises have no cancellation — it just stops being
 * waited on.
 */
export async function settleWithin(promises: Promise<unknown>[], timeoutMs: number): Promise<boolean> {
    if (promises.length === 0) return true;
    if (timeoutMs <= 0) return false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const expiry = new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
        // A shutdown timer must never be the thing holding the process open.
        unrefTimer(timer);
    });
    try {
        return await Promise.race([Promise.allSettled(promises).then(() => true), expiry]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

/**
 * An in-flight extend plus the additional amount its wire call asked for —
 * the figure a joiner compares its own shortfall against.
 */
interface ExtendFlight {
    requestedAdditional: number;
    promise: Promise<LeaseEntry | undefined>;
}

/**
 * Owns the lifecycle of `credit_lease` rows for a single client: acquire on
 * first use or after expiry, extend when the local view dips below the low
 * water mark, release on `client.close()`.
 *
 * Concurrency: each operation (acquire, extend) has its own best-effort
 * single-flight map keyed by `(company, creditType)`. It's best-effort —
 * callers racing ahead of the registration can still issue duplicate wire
 * calls — which is safe because the server is idempotent for an active slot
 * and `replace` keeps the first live lease.
 */
export class CreditLeaseManager {
    private readonly creditsClient: CreditsClient;
    private readonly leaseStore: ILeaseStore;
    private readonly logger: Logger;
    private readonly config: CreditLeaseConfig;
    // Kept separate so acquire and extend never share an in-flight promise.
    private readonly inflightAcquire = new Map<string, Promise<LeaseEntry | undefined>>();
    private readonly inflightExtend = new Map<string, ExtendFlight>();
    // Lease work nobody awaits: the redundant release a lost acquire race
    // issues, and the background extends callers fire and forget. `drain()`
    // waits these out so a close releases what they installed.
    private readonly background = new Set<Promise<unknown>>();
    private stopped = false;

    constructor(opts: {
        creditsClient: CreditsClient;
        leaseStore: ILeaseStore;
        logger: Logger;
        config: CreditLeaseConfig;
    }) {
        this.creditsClient = opts.creditsClient;
        this.leaseStore = opts.leaseStore;
        this.logger = opts.logger;
        this.config = opts.config;
    }

    resolveConfig(creditTypeId: string): ResolvedLeaseConfig {
        const override = this.config.overrides?.[creditTypeId];
        return {
            leaseDuration:
                override?.defaultLeaseDuration ?? this.config.defaultLeaseDuration ?? DEFAULT_LEASE_DURATION_MS,
            reservationTTL:
                override?.defaultReservationTTL ?? this.config.defaultReservationTTL ?? DEFAULT_RESERVATION_TTL_MS,
            leaseSize: override?.defaultLeaseSize ?? this.config.defaultLeaseSize ?? DEFAULT_LEASE_SIZE,
            lowWaterMark: override?.lowWaterMark ?? this.config.lowWaterMark ?? DEFAULT_LOW_WATER_MARK,
        };
    }

    /**
     * Return the current lease entry, acquiring one (or replacing an expired
     * one) if none is live. Best-effort single-flight: callers arriving after
     * a request is registered share it (the first caller's `requestOptions`
     * win); callers racing ahead of registration may duplicate the wire call,
     * which the server's idempotent acquire absorbs.
     * Never rejects: a store (Redis) failure is logged and reported as
     * `undefined`, the same as a wire failure, so callers route it through
     * their fail-open/fail-closed handling instead of an unhandled rejection.
     */
    async acquireIfNeeded(
        companyId: string,
        creditTypeId: string,
        requestOptions?: CreditsClient.RequestOptions,
    ): Promise<LeaseEntry | undefined> {
        if (this.stopped) {
            // Past stop() the drain has run or is running, so a lease acquired
            // now is one nothing is left to release.
            this.logger.debug(`Lease manager is stopped; skipping acquire for ${companyId}/${creditTypeId}`);
            return undefined;
        }
        let existing: LeaseEntry | undefined;
        try {
            existing = await this.leaseStore.get(companyId, creditTypeId);
        } catch (err) {
            this.logger.error(`Failed to read lease store for ${companyId}/${creditTypeId}: ${err}`);
            return undefined;
        }
        if (existing && existing.expiresAt.getTime() > Date.now()) {
            return existing;
        }
        // An expired (or absent) slot is left for `replace` to overwrite — it
        // guards on expiry and does the DEL+write atomically (single Lua exec
        // in Redis, single lock in memory). We deliberately do NOT drop the
        // stale entry here first: a standalone DEL is a separate, non-atomic op
        // that can interleave between a sibling pod's `get` and its `replace`,
        // clobbering a lease that pod just installed and orphaning it until
        // server-side expiry. Reading a stale entry in the gap is harmless —
        // every path that acts on a lease (`tryReserve`, and the expiry check
        // just above) re-guards on expiry before trusting it. The server treats
        // an expired lease as released and refunds the full grant back to the
        // company balance.

        // Check again: stop() may have landed during the store read, and a
        // drain that ran in that gap saw nothing in flight.
        if (this.stopped) {
            this.logger.debug(`Lease manager is stopped; skipping acquire for ${companyId}/${creditTypeId}`);
            return undefined;
        }

        const key = leaseKey(companyId, creditTypeId);
        const inflight = this.inflightAcquire.get(key);
        if (inflight) return inflight;

        const promise = this.acquire(companyId, creditTypeId, requestOptions).finally(() => {
            this.inflightAcquire.delete(key);
        });
        this.inflightAcquire.set(key, promise);
        return promise;
    }

    private async acquire(
        companyId: string,
        creditTypeId: string,
        requestOptions?: CreditsClient.RequestOptions,
    ): Promise<LeaseEntry | undefined> {
        const resolved = this.resolveConfig(creditTypeId);
        const body: api.AcquireCreditLeaseRequestBody = {
            companyId,
            creditTypeId,
            requestedAmount: resolved.leaseSize,
            expiresAt: new Date(Date.now() + resolved.leaseDuration),
        };

        try {
            const response = await this.creditsClient.acquireCreditLease(body, requestOptions);
            const data = response.data;
            const wrote = await this.leaseStore.replace({
                leaseId: data.id,
                companyId: data.companyId,
                creditTypeId: data.creditTypeId,
                grantedAmount: data.grantedAmount,
                expiresAt: data.expiresAt,
            });
            if (!wrote) {
                // Another instance (sharing the backend) installed a live lease
                // for this slot first — `replace` kept theirs to preserve its
                // already-debited balance. The server is idempotent for an
                // active (company, creditType) slot, so a racing acquire is
                // normally handed back the SAME lease the sibling installed
                // (`reused_active`) — in which case there is nothing to
                // release: releasing would mark the shared lease released
                // server-side and refund its remainder while every pod keeps
                // reserving against it locally, over-spending until the local
                // row expires. Only when the server minted a *different* lease
                // (e.g. the sibling's lease replaced one that expired during
                // our wire call) is ours a redundant hold nobody will draw on
                // — release that one so it isn't orphaned against the
                // company's balance until its server-side expiry.
                // Fire-and-forget; a failed release just falls back to lease
                // expiry. When the slot reads empty (expired in the gap), skip
                // the release too — `data.id` may well be the lease the next
                // acquire is handed back.
                const current = await this.leaseStore.get(companyId, creditTypeId);
                if (current && current.leaseId !== data.id) {
                    this.logger.debug(
                        `Lost acquire race for ${companyId}/${creditTypeId}; releasing redundant lease ${data.id}`,
                    );
                    void this.track(
                        this.creditsClient
                            .releaseCreditLease(data.id, {})
                            .catch((err) =>
                                this.logger.warn(`Failed to release redundant credit lease ${data.id}: ${err}`),
                            ),
                    );
                } else {
                    this.logger.debug(
                        `Lost acquire race for ${companyId}/${creditTypeId}; server returned the installed lease ${data.id}, nothing to release`,
                    );
                }
                return current;
            } else {
                this.logger.debug(
                    `Acquired credit lease ${data.id} for ${companyId}/${creditTypeId} (granted=${data.grantedAmount}, expires=${data.expiresAt.toISOString()})`,
                );
            }
            return await this.leaseStore.get(companyId, creditTypeId);
        } catch (err) {
            this.logger.error(`Failed to acquire credit lease for ${companyId}/${creditTypeId}: ${err}`);
            return undefined;
        }
    }

    /**
     * Single-flight: kick off a background extend when one is warranted.
     * An extend is triggered if EITHER:
     *   - the local remaining is below the low-water-mark ratio (steady-state
     *     refresh), or
     *   - the caller passes `requiredCredits` and the local remaining is below
     *     that figure (a single check just failed a reserve for that many
     *     credits — extend opportunistically instead of waiting for the next
     *     sub-watermark check).
     * A caller arriving while an extend is in flight joins it. If its own
     * shortfall is larger than what that extend asked for, it waits the flight
     * out and then issues exactly one follow-up extend for the remaining
     * difference — otherwise it would inherit a tranche-sized ask and fail its
     * post-extend retry with credits still sitting on the server.
     * Returns the in-flight promise so callers can await it or fire-and-forget.
     * Never rejects (it is often fire-and-forget — a rejection would surface
     * as an unhandled promise rejection).
     */
    maybeExtendInBackground(
        companyId: string,
        creditTypeId: string,
        requiredCredits?: number,
        requestOptions?: CreditsClient.RequestOptions,
    ): Promise<LeaseEntry | undefined> {
        if (this.stopped) {
            // Extending past stop() re-holds credits on a lease the close is
            // about to release, or has already released.
            this.logger.debug(`Lease manager is stopped; skipping extend for ${companyId}/${creditTypeId}`);
            return Promise.resolve(undefined);
        }
        // Tracked whole, not just the wire call inside it: callers void this,
        // so between the store read and the extend there would otherwise be a
        // window where a drain sees nothing pending.
        return this.track(this.extendIfNeeded(companyId, creditTypeId, requiredCredits, requestOptions, true));
    }

    private async extendIfNeeded(
        companyId: string,
        creditTypeId: string,
        requiredCredits: number | undefined,
        requestOptions: CreditsClient.RequestOptions | undefined,
        allowFollowUp: boolean,
    ): Promise<LeaseEntry | undefined> {
        const entry = await this.readLiveLease(companyId, creditTypeId);
        if (!entry) return undefined;
        const resolved = this.resolveConfig(creditTypeId);
        if (!this.needsExtend(entry, resolved, requiredCredits)) return entry;

        // Size the extend to cover the request that triggered it: a single
        // check needing more than `localRemaining + leaseSize` would otherwise
        // fail its post-extend retry forever, even with ample server balance.
        // The watermark-driven steady-state path (no requiredCredits) keeps
        // requesting the configured tranche. Sized here, one level above the
        // wire call, so the flight we register below and the request body
        // provably carry the same number for a joiner to compare against.
        const shortfall = requiredCredits !== undefined ? requiredCredits - entry.localRemainingCredits : 0;
        const additionalAmount = Math.max(resolved.leaseSize, shortfall);

        const key = leaseKey(companyId, creditTypeId);
        const inflight = this.inflightExtend.get(key);
        if (inflight) {
            const joined = await inflight.promise;
            // The flight already asked for at least what we need — every
            // watermark-driven joiner, and any check the tranche covers. One
            // wire call serves all of them, which is the point of single-flight.
            if (additionalAmount <= inflight.requestedAdditional || !allowFollowUp) return joined;
            // Our shortfall outran the flight's ask. We waited it out rather
            // than racing a second extend onto the same lease; now top up the
            // difference with exactly one more, re-reading the slot the flight
            // just moved. `allowFollowUp: false` keeps this from chaining: when
            // the server cannot cover the request, a chain would spin.
            return this.extendIfNeeded(companyId, creditTypeId, requiredCredits, requestOptions, false);
        }
        return this.startExtend(
            key,
            companyId,
            creditTypeId,
            resolved,
            requiredCredits,
            additionalAmount,
            requestOptions,
        );
    }

    /**
     * Read the slot, reporting `undefined` when the read fails or the lease is
     * absent or expired. An expired lease is never extended: the server treats
     * it as released (its remainder already refunded to the company balance),
     * so the right move is a fresh acquire, which the next check's
     * `acquireIfNeeded` performs. Extending would at best waste a wire call and
     * at worst resurrect a stale local row.
     */
    private async readLiveLease(companyId: string, creditTypeId: string): Promise<LeaseEntry | undefined> {
        let entry: LeaseEntry | undefined;
        try {
            entry = await this.leaseStore.get(companyId, creditTypeId);
        } catch (err) {
            this.logger.warn(`Failed to read lease store for ${companyId}/${creditTypeId}: ${err}`);
            return undefined;
        }
        if (!entry) return undefined;
        if (entry.expiresAt.getTime() <= Date.now()) return undefined;
        return entry;
    }

    /** Whether `entry` sits low enough to warrant an extend. */
    private needsExtend(
        entry: LeaseEntry,
        resolved: ResolvedLeaseConfig,
        requiredCredits: number | undefined,
    ): boolean {
        const ratio = entry.localRemainingCredits / Math.max(entry.grantedAmount, 1);
        const belowWatermark = ratio <= resolved.lowWaterMark;
        const belowRequired = requiredCredits !== undefined && entry.localRemainingCredits < requiredCredits;
        return belowWatermark || belowRequired;
    }

    /**
     * Register and run an extend as the slot's in-flight one. The cleanup is
     * identity-guarded rather than an unconditional `delete`: a joiner whose
     * shortfall outran this flight registers a follow-up for the same key, and
     * this flight's `finally` must not evict it.
     */
    private startExtend(
        key: string,
        companyId: string,
        creditTypeId: string,
        resolved: ResolvedLeaseConfig,
        requiredCredits: number | undefined,
        additionalAmount: number,
        requestOptions?: CreditsClient.RequestOptions,
    ): Promise<LeaseEntry | undefined> {
        const promise = this.recheckAndExtend(
            companyId,
            creditTypeId,
            resolved,
            requiredCredits,
            additionalAmount,
            requestOptions,
        ).finally(() => {
            if (this.inflightExtend.get(key)?.promise === promise) this.inflightExtend.delete(key);
        });
        this.inflightExtend.set(key, { requestedAdditional: additionalAmount, promise });
        return promise;
    }

    /**
     * Re-read the slot now that this flight owns it, and extend only if the
     * fresh row still warrants one. The row that decided this extend was read
     * before the flight was registered, so an extend that landed in that gap,
     * clearing its own flight on the way out, would otherwise be followed by a
     * second extend, under a new idempotency key, for a lease it already topped
     * up. The registered `requestedAdditional` stands: a joiner compares its
     * shortfall against that figure, so the wire body has to carry it.
     */
    private async recheckAndExtend(
        companyId: string,
        creditTypeId: string,
        resolved: ResolvedLeaseConfig,
        requiredCredits: number | undefined,
        additionalAmount: number,
        requestOptions?: CreditsClient.RequestOptions,
    ): Promise<LeaseEntry | undefined> {
        const entry = await this.readLiveLease(companyId, creditTypeId);
        if (!entry) return undefined;
        if (!this.needsExtend(entry, resolved, requiredCredits)) return entry;
        return this.extend(entry, resolved, additionalAmount, requestOptions);
    }

    private async extend(
        entry: LeaseEntry,
        resolved: ResolvedLeaseConfig,
        additionalAmount: number,
        requestOptions?: CreditsClient.RequestOptions,
    ): Promise<LeaseEntry | undefined> {
        const body: api.ExtendCreditLeaseRequestBody = {
            additionalAmount,
            expiresAt: new Date(Date.now() + resolved.leaseDuration),
            // Minted once per extend, outside the wire call, so the transport's
            // retries resend the same key: a retry after a lost 2xx is handed
            // the lease as it stands instead of growing it a second time.
            idempotencyKey: randomUUID(),
        };
        try {
            const response = await this.creditsClient.extendCreditLease(entry.leaseId, body, requestOptions);
            const data = response.data;
            // Reconcile the local row to the server's authoritative TOTAL. The
            // store computes the credit delta atomically against its current
            // total — not our pre-wire-call `entry` read: per-process
            // single-flight doesn't cover sibling pods, so two pods extending
            // the same shared lease concurrently would each apply a stale-read
            // delta and mint phantom credits. A total a sibling already
            // applied lands as a no-op, so the applies converge in any order.
            // Pinned to the lease the server extended: if it expired during
            // the wire call and a successor took the slot, the local extend
            // is dropped rather than minting the delta onto the successor.
            await this.leaseStore.extend(
                entry.companyId,
                entry.creditTypeId,
                data.grantedAmount,
                data.expiresAt,
                entry.leaseId,
            );
            this.logger.debug(
                `Extended credit lease ${entry.leaseId} to ${data.grantedAmount} (was ${entry.grantedAmount} at last read, expires ${data.expiresAt.toISOString()})`,
            );
            return await this.leaseStore.get(entry.companyId, entry.creditTypeId);
        } catch (err) {
            this.logger.warn(`Failed to extend credit lease ${entry.leaseId}: ${err}`);
            return undefined;
        }
    }

    /** Hold a reference to unawaited work so `drain()` can wait it out. */
    private track<T>(promise: Promise<T>): Promise<T> {
        this.background.add(promise);
        void promise.then(
            () => this.background.delete(promise),
            () => this.background.delete(promise),
        );
        return promise;
    }

    /**
     * Refuse new lease work. Idempotent, and paired with `drain()`: stopping
     * first is what makes the drain terminate, since nothing can enqueue
     * behind it.
     */
    stop(): void {
        this.stopped = true;
    }

    /**
     * Wait out lease work already on the wire, so a close releases what that
     * work installs instead of orphaning it. Bounded: whatever has not landed
     * by `timeoutMs` is abandoned rather than stalling the caller's shutdown,
     * and the credits it holds fall back to server-side expiry.
     */
    async drain(timeoutMs: number = SHUTDOWN_DRAIN_TIMEOUT_MS): Promise<void> {
        const deadline = Date.now() + timeoutMs;
        for (;;) {
            const pending = [
                ...this.inflightAcquire.values(),
                ...[...this.inflightExtend.values()].map((flight) => flight.promise),
                ...this.background,
            ];
            if (pending.length === 0) return;
            // Settling one round can enqueue another (an acquire that loses its
            // race fires a release), so keep going until the set empties.
            if (!(await settleWithin(pending, deadline - Date.now()))) {
                this.logger.warn(
                    `Timed out after ${timeoutMs}ms draining in-flight credit lease work; ` +
                        "any credits it holds will be released by server-side expiry",
                );
                return;
            }
        }
    }

    /**
     * Release every live lease held in the store. ONLY safe when the store is
     * per-process (in-memory): those leases are exclusively this process's, so
     * releasing them on `close()` returns their unspent remainder to the
     * company balance immediately instead of waiting out the lease expiry. A
     * shared (Redis) store must never do this — sibling pods are still
     * drawing on the same leases — and is excluded by the `list` capability
     * check (only the in-memory store implements it). Best-effort: failures
     * are logged and the lease falls back to server-side expiry.
     * Bounded by `timeoutMs`, so a store or wire call that never lands cannot
     * hold a closing client open; whatever is abandoned expires server-side.
     */
    async releaseAllLocalLeases(timeoutMs: number = SHUTDOWN_DRAIN_TIMEOUT_MS): Promise<void> {
        const entries = this.leaseStore.list?.();
        if (!entries || entries.length === 0) return;
        const releases = entries.map(async (entry) => {
            // Skip expired leases: the server already swept and refunded them.
            if (entry.expiresAt.getTime() <= Date.now()) return;
            try {
                await this.creditsClient.releaseCreditLease(entry.leaseId, {});
                await this.leaseStore.drop(entry.companyId, entry.creditTypeId);
                this.logger.debug(`Released credit lease ${entry.leaseId} on close`);
            } catch (err) {
                this.logger.warn(
                    `Failed to release credit lease ${entry.leaseId} on close (it will expire server-side): ${err}`,
                );
            }
        });
        if (!(await settleWithin(releases, timeoutMs))) {
            this.logger.warn(
                `Timed out after ${timeoutMs}ms releasing credit leases on close; ` +
                    "any still held will be released by server-side expiry",
            );
        }
    }
}
