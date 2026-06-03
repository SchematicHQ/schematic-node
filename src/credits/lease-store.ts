/**
 * In-memory lease store, keyed by `${companyId}:${creditTypeId}`.
 *
 * Holds the lease ID, original granted amount, expiry, and the SDK's local
 * view of `localRemainingCredits` — the portion of the lease not yet reserved
 * by an outstanding reservation. Per-key serialization (Promise chain) keeps
 * reserve / refund / replace atomic without external locking.
 *
 * The store doesn't talk to the API directly; `CreditLeaseManager` drives
 * acquire/extend/release through the wire client and uses these methods to
 * mirror remote state locally.
 *
 * For cross-pod deployments, swap this for `RedisLeaseStore` — both
 * implement `ILeaseStore`.
 */

export interface LeaseEntry {
    leaseId: string;
    companyId: string;
    creditTypeId: string;
    grantedAmount: number;
    localRemainingCredits: number;
    expiresAt: Date;
}

/** Backing-store contract shared by `LeaseStore` (in-memory) and `RedisLeaseStore` (shared). */
export interface ILeaseStore {
    get(companyId: string, creditTypeId: string): Promise<LeaseEntry | undefined> | LeaseEntry | undefined;
    /**
     * Install a fresh lease for the slot, but only if no live lease already
     * occupies it. Implementations must be safe against concurrent writers
     * sharing the backend: if a live (unexpired) lease is already present —
     * even one with a different `leaseId`, e.g. acquired by a sibling pod that
     * raced this one — leave it untouched so its already-debited
     * `localRemainingCredits` wins. Returns `true` if it wrote a fresh row,
     * `false` if it kept an existing live lease (the caller should release the
     * lease it acquired ONLY if its ID differs from the installed one — the
     * server hands a racing acquire the same active lease back, and releasing
     * that would pull the shared lease out from under every sibling).
     */
    replace(entry: Omit<LeaseEntry, "localRemainingCredits">): Promise<boolean>;
    /**
     * Reconcile the slot's lease to the server-authoritative `grantedAmount`
     * total (after a remote extend), crediting the difference to
     * `localRemainingCredits`. The delta MUST be computed atomically inside
     * the store against the *current* stored total — never by the caller from
     * a pre-wire-call read: with a shared backend, two pods extending the same
     * lease concurrently would each apply a delta against the same stale read
     * and mint phantom credits. Reconciling to the absolute total converges
     * regardless of arrival order (a total a sibling already applied lands as
     * a no-op). `newExpiresAt` only ever moves the expiry forward, so an
     * out-of-order apply can't shorten a lease a sibling just extended. When
     * `leaseId` is supplied, the extend applies ONLY if the slot still holds
     * that lease: the server extended lease A, so its credits must not land on
     * a successor lease B that replaced A after it expired mid-extend —
     * crediting B would mint credits locally that the server granted to A
     * (whose remainder it refunds at A's expiry). Mirrors the pin on `refund`.
     */
    extend(
        companyId: string,
        creditTypeId: string,
        grantedAmount: number,
        newExpiresAt?: Date,
        leaseId?: string,
    ): Promise<void>;
    drop(companyId: string, creditTypeId: string): Promise<void>;
    /**
     * Atomically check-and-debit `credits` from the lease's remaining balance.
     * Returns the post-debit `localRemainingCredits` on success, or `null` if
     * there is no live lease, the balance is insufficient, or `credits` is not
     * a finite non-negative number (NaN must never reach the debit — it slips
     * through every numeric comparison and would poison the balance into
     * allowing everything). Returning the balance rather than a boolean lets
     * the caller derive the pre-debit figure (`returned + credits`) without a
     * follow-up read.
     */
    tryReserve(companyId: string, creditTypeId: string, credits: number): Promise<number | null>;
    /**
     * Refund credits to the slot's lease balance (clamped at `grantedAmount`).
     * When `leaseId` is supplied, the refund applies ONLY if the slot still
     * holds that lease: a reservation carved out of lease A must never inflate
     * a successor lease B that replaced it after A expired — A's unspent
     * remainder (including this slice) was already refunded to the company
     * balance server-side when A expired, so crediting B would double-count.
     */
    refund(companyId: string, creditTypeId: string, credits: number, leaseId?: string): Promise<void>;
    /**
     * Snapshot of all current entries. Only meaningful (and only implemented)
     * for the per-process in-memory store, where `close()` releases this
     * process's exclusively-held leases; a shared backend must NOT enumerate —
     * sibling pods may still be drawing on those leases.
     */
    list?(): LeaseEntry[];
}

export function leaseKey(companyId: string, creditTypeId: string): string {
    return `${companyId}:${creditTypeId}`;
}

export class LeaseStore implements ILeaseStore {
    private leases = new Map<string, LeaseEntry>();
    /**
     * Per-key serializer chain. Each `withLock` appends to the tail so
     * reserve / refund / replace see consistent intermediate state.
     */
    private locks = new Map<string, Promise<unknown>>();

    /** Snapshot of the current entry, or undefined if no active lease. */
    get(companyId: string, creditTypeId: string): LeaseEntry | undefined {
        const entry = this.leases.get(leaseKey(companyId, creditTypeId));
        return entry ? { ...entry } : undefined;
    }

    /**
     * Replace (or insert) the lease for the given (company, creditType).
     * Resets `localRemainingCredits` to `grantedAmount` for a new lease.
     * If a live lease already occupies the slot — regardless of `leaseId` — it
     * is left alone so any already-debited `localRemainingCredits` wins.
     * Returns `true` if a fresh row was written, `false` if an existing live
     * lease was kept.
     */
    async replace(entry: Omit<LeaseEntry, "localRemainingCredits">): Promise<boolean> {
        const key = leaseKey(entry.companyId, entry.creditTypeId);
        return this.withLock(key, () => {
            const existing = this.leases.get(key);
            if (existing && existing.expiresAt.getTime() > Date.now()) {
                // A live lease already holds this slot — preserve its
                // already-debited localRemaining instead of clobbering it.
                return false;
            }
            this.leases.set(key, {
                ...entry,
                localRemainingCredits: entry.grantedAmount,
            });
            return true;
        });
    }

    /**
     * Reconcile an existing lease to the server-authoritative `grantedAmount`
     * total (after a remote extend), crediting the difference to
     * `localRemainingCredits`. The delta is computed against the CURRENT
     * stored total under the key lock, so concurrent extends converge instead
     * of double-counting (see `ILeaseStore.extend`). If no lease exists for
     * the key, this is a no-op (caller should have replaced). When `leaseId`
     * is given, the extend is dropped if the slot now holds a different lease.
     */
    async extend(
        companyId: string,
        creditTypeId: string,
        grantedAmount: number,
        newExpiresAt?: Date,
        leaseId?: string,
    ): Promise<void> {
        const key = leaseKey(companyId, creditTypeId);
        return this.withLock(key, () => {
            const entry = this.leases.get(key);
            if (!entry) return;
            if (leaseId !== undefined && entry.leaseId !== leaseId) return;
            const add = grantedAmount - entry.grantedAmount;
            if (add > 0) {
                entry.grantedAmount = grantedAmount;
                entry.localRemainingCredits += add;
            }
            // Expiry only moves forward: an out-of-order apply must not
            // shorten a lease a concurrent extend already pushed out.
            if (newExpiresAt && newExpiresAt.getTime() > entry.expiresAt.getTime()) {
                entry.expiresAt = newExpiresAt;
            }
        });
    }

    /** Drop the lease entry (after a remote release or lazy expiry). */
    async drop(companyId: string, creditTypeId: string): Promise<void> {
        const key = leaseKey(companyId, creditTypeId);
        return this.withLock(key, () => {
            this.leases.delete(key);
        });
    }

    /**
     * Attempt to reserve `credits` from the local remaining balance.
     * Returns the post-debit balance on success, `null` if there isn't enough
     * remaining (see `ILeaseStore.tryReserve`).
     */
    async tryReserve(companyId: string, creditTypeId: string, credits: number): Promise<number | null> {
        // Reject non-finite/negative debits outright: `NaN` passes every `<`
        // comparison below and `balance -= NaN` would poison the lease into
        // approving all future reserves (`NaN < x` is always false).
        if (!Number.isFinite(credits) || credits < 0) return null;
        const key = leaseKey(companyId, creditTypeId);
        return this.withLock(key, () => {
            const entry = this.leases.get(key);
            if (!entry) return null;
            // Never reserve against an expired lease: the server treats it as
            // released and refunds the grant to the company balance, so the
            // local `localRemainingCredits` is stale. Mirrors the expiry guard
            // in the Redis store and the lazy expiry in `CreditLeaseManager`.
            if (entry.expiresAt.getTime() <= Date.now()) return null;
            if (entry.localRemainingCredits < credits) return null;
            entry.localRemainingCredits -= credits;
            return entry.localRemainingCredits;
        });
    }

    /**
     * Refund credits back to the local balance (capped at grantedAmount).
     * When `leaseId` is given, the refund is dropped if the slot now holds a
     * different lease (see `ILeaseStore.refund`).
     */
    async refund(companyId: string, creditTypeId: string, credits: number, leaseId?: string): Promise<void> {
        if (credits <= 0) return;
        const key = leaseKey(companyId, creditTypeId);
        return this.withLock(key, () => {
            const entry = this.leases.get(key);
            if (!entry) return;
            if (leaseId !== undefined && entry.leaseId !== leaseId) return;
            entry.localRemainingCredits = Math.min(entry.localRemainingCredits + credits, entry.grantedAmount);
        });
    }

    /** Snapshot of all current entries (see `ILeaseStore.list`). */
    list(): LeaseEntry[] {
        return Array.from(this.leases.values(), (entry) => ({ ...entry }));
    }

    private async withLock<T>(key: string, fn: () => T | Promise<T>): Promise<T> {
        const prev = this.locks.get(key) ?? Promise.resolve();
        let resolve!: () => void;
        const next = new Promise<void>((r) => (resolve = r));
        const chain = prev.then(() => next);
        this.locks.set(key, chain);
        await prev;
        try {
            return await fn();
        } finally {
            resolve();
            // Best-effort cleanup so the map doesn't grow without bound.
            // Only delete if we're still the tail — otherwise a later caller
            // has appended and needs the chain to stay live.
            if (this.locks.get(key) === chain) {
                this.locks.delete(key);
            }
        }
    }
}
