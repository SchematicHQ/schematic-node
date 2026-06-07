import type * as api from "../api";
import type { CreditsClient } from "../api/resources/credits/client/Client";
import type { Logger } from "../logger";

import { type ILeaseStore, type LeaseEntry, leaseKey } from "./lease-store";
import {
    DEFAULT_LEASE_DURATION_MS,
    DEFAULT_LEASE_SIZE,
    DEFAULT_LOW_WATER_MARK,
    DEFAULT_RESERVATION_TTL_MS,
    type CreditLeaseConfig,
    type ResolvedLeaseConfig,
} from "./types";

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
    private readonly inflightExtend = new Map<string, Promise<LeaseEntry | undefined>>();

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
        // every mutate/read path (`tryReserve`, `getCreditBalance`) already
        // guards on expiry. The server treats an expired lease as released and
        // refunds the full grant back to the company balance.

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
                    void this.creditsClient
                        .releaseCreditLease(data.id, {})
                        .catch((err) =>
                            this.logger.warn(`Failed to release redundant credit lease ${data.id}: ${err}`),
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
     * Returns the in-flight promise so callers can await it or fire-and-forget.
     * Never rejects (it is often fire-and-forget — a rejection would surface
     * as an unhandled promise rejection).
     */
    async maybeExtendInBackground(
        companyId: string,
        creditTypeId: string,
        requiredCredits?: number,
        requestOptions?: CreditsClient.RequestOptions,
    ): Promise<LeaseEntry | undefined> {
        let entry: LeaseEntry | undefined;
        try {
            entry = await this.leaseStore.get(companyId, creditTypeId);
        } catch (err) {
            this.logger.warn(`Failed to read lease store for ${companyId}/${creditTypeId}: ${err}`);
            return undefined;
        }
        if (!entry) return undefined;
        // Never extend an expired lease: the server treats it as released (its
        // remainder already refunded to the company balance), so the right
        // move is a fresh acquire, which the next check's `acquireIfNeeded`
        // performs. Extending would at best waste a wire call and at worst
        // resurrect a stale local row.
        if (entry.expiresAt.getTime() <= Date.now()) return undefined;
        const resolved = this.resolveConfig(creditTypeId);
        const ratio = entry.localRemainingCredits / Math.max(entry.grantedAmount, 1);
        const belowWatermark = ratio <= resolved.lowWaterMark;
        const belowRequired = requiredCredits !== undefined && entry.localRemainingCredits < requiredCredits;
        if (!belowWatermark && !belowRequired) return entry;

        const key = leaseKey(companyId, creditTypeId);
        const inflight = this.inflightExtend.get(key);
        if (inflight) return inflight;

        const promise = this.extend(entry, resolved, requiredCredits, requestOptions).finally(() => {
            this.inflightExtend.delete(key);
        });
        this.inflightExtend.set(key, promise);
        return promise;
    }

    private async extend(
        entry: LeaseEntry,
        resolved: ResolvedLeaseConfig,
        requiredCredits?: number,
        requestOptions?: CreditsClient.RequestOptions,
    ): Promise<LeaseEntry | undefined> {
        // Size the extend to cover the request that triggered it: a single
        // check needing more than `localRemaining + leaseSize` would otherwise
        // fail its post-extend retry forever, even with ample server balance.
        // The watermark-driven steady-state path (no requiredCredits) keeps
        // requesting the configured tranche.
        const shortfall = requiredCredits !== undefined ? requiredCredits - entry.localRemainingCredits : 0;
        const body: api.ExtendCreditLeaseRequestBody = {
            additionalAmount: Math.max(resolved.leaseSize, shortfall),
            expiresAt: new Date(Date.now() + resolved.leaseDuration),
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

    /**
     * Release every live lease held in the store. ONLY safe when the store is
     * per-process (in-memory): those leases are exclusively this process's, so
     * releasing them on `close()` returns their unspent remainder to the
     * company balance immediately instead of waiting out the lease expiry. A
     * shared (Redis) store must never do this — sibling pods are still
     * drawing on the same leases — and is excluded by the `list` capability
     * check (only the in-memory store implements it). Best-effort: failures
     * are logged and the lease falls back to server-side expiry.
     */
    async releaseAllLocalLeases(): Promise<void> {
        const entries = this.leaseStore.list?.();
        if (!entries || entries.length === 0) return;
        await Promise.all(
            entries.map(async (entry) => {
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
            }),
        );
    }
}
