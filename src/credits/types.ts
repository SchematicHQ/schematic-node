import type * as api from "../api";
import type { RedisClient } from "../cache/redis";

/**
 * Behavior when a lease cannot be acquired or reserved against (API error,
 * lease/reservation store unreachable, insufficient balance).
 * - `fail-open`: err on the side of assuming the credits are there — the rules
 *   engine still evaluates the flag (plan targeting, overrides, and all
 *   non-credit conditions apply) with the credit balance substituted to an
 *   effectively unlimited value, so only the credit gate is bypassed. No
 *   reservation is issued.
 * - `fail-closed`: `check()` returns `{ allowed: false }` so the caller blocks the action
 */
export type OnAcquireFailure = "fail-open" | "fail-closed";

// Single source of truth for defaults consumed by `CreditLeaseManager` and
// `SchematicClient`. Re-exported so the values referenced in the doc strings
// below stay accurate even if a consumer overrides only a subset of fields.
export const DEFAULT_LEASE_DURATION_MS: number = 5 * 60 * 1000;
export const DEFAULT_RESERVATION_TTL_MS: number = 60 * 1000;
export const DEFAULT_LEASE_SIZE: number = 10_000;
export const DEFAULT_LOW_WATER_MARK: number = 0.25;
export const DEFAULT_SWEEP_INTERVAL_MS: number = 1000;
// How long `prewarm()` is willing to wait for a freshly-identified company to
// surface in the datastream cache before giving up. Long enough to cover the
// buffer-flush → server-ingest → datastream-push round-trip for a new
// company; short enough that a misconfigured caller doesn't hang.
export const DEFAULT_PREWARM_RESOLVE_TIMEOUT_MS: number = 5000;
export const DEFAULT_PREWARM_POLL_INTERVAL_MS: number = 100;

/**
 * Configuration block enabling client-side lease + reservation behavior on
 * `client.check` / `client.trackWithReservation`. Omit to keep the SDK
 * lease-unaware (`check` falls back to a plain flag check).
 */
export interface CreditLeaseConfig {
    /** Default lease duration in milliseconds. Default `DEFAULT_LEASE_DURATION_MS` (5 minutes). */
    defaultLeaseDuration?: number;
    /**
     * Default reservation TTL in milliseconds. Default `DEFAULT_RESERVATION_TTL_MS`
     * (60 seconds). Size this above the longest expected gap between `check()`
     * and `trackWithReservation()`: a settle arriving after the TTL still bills
     * the server but doesn't re-debit the local lease (its hold was already
     * swept back), so the local balance reads high until the lease rolls over.
     */
    defaultReservationTTL?: number;
    /** Default lease size (credit amount requested). Default `DEFAULT_LEASE_SIZE` (10000). */
    defaultLeaseSize?: number;
    /**
     * Fraction of remaining lease balance below which the SDK kicks off a
     * background extend. Default `DEFAULT_LOW_WATER_MARK` (0.25).
     */
    lowWaterMark?: number;
    /** Sweep interval (ms) for expired reservations. Default `DEFAULT_SWEEP_INTERVAL_MS` (1000). */
    sweepIntervalMs?: number;
    /**
     * Max time `prewarm()` will wait for a freshly-identified company to
     * surface in the datastream cache when only secondary keys are passed.
     * Set to 0 to skip waiting entirely (prewarm bails immediately if the
     * company isn't already cached). Default `DEFAULT_PREWARM_RESOLVE_TIMEOUT_MS`
     * (5000ms).
     */
    prewarmResolveTimeoutMs?: number;
    /**
     * Pre-connected Redis client for lease + reservation state. Optional: when
     * omitted, the SDK reuses the DataStream cache's Redis client
     * (`dataStream.redisClient`) if one is configured, so an existing Redis
     * setup backs leases automatically. Set this only to point lease state at a
     * *different* Redis than the DataStream cache.
     *
     * When neither this nor `dataStream.redisClient` is configured, the SDK
     * falls back to per-process in-memory stores — single-pod only, since
     * cross-pod gating is lost (a warning is logged). With a Redis client
     * present, the Lua-driven `tryReserve` / `consume` paths give atomic
     * cross-pod gating.
     */
    redisClient?: RedisClient;
    /**
     * Optional Redis key prefix. Falls back to `dataStream.redisKeyPrefix` when
     * unset, then to `schematic:`.
     */
    redisKeyPrefix?: string;
    /** Per-credit-type overrides (keyed by credit type ID). */
    overrides?: Record<
        string,
        Partial<Omit<CreditLeaseConfig, "overrides" | "sweepIntervalMs" | "redisClient" | "redisKeyPrefix">>
    >;
}

/** Resolved config for a single credit type after applying defaults + overrides. */
export interface ResolvedLeaseConfig {
    leaseDuration: number;
    reservationTTL: number;
    leaseSize: number;
    lowWaterMark: number;
}

/** Handle returned by `client.check` when a reservation is issued. Pass to `client.trackWithReservation`. */
export interface Reservation {
    /** Opaque reservation ID. */
    id: string;
    /** Underlying lease ID this reservation draws from. */
    leaseId: string;
    /** Company that owns the lease. */
    companyId: string;
    /** Credit type the reservation reserves against. */
    creditTypeId: string;
    /** Event subtype to record on the Track event when consumed. */
    eventSubtype: string;
    /** Quantity (in event units) the caller declared upfront. */
    quantityReserved: number;
    /** Credits reserved = `quantityReserved * consumptionRate`. */
    creditsReserved: number;
    /** Consumption rate at the time the reservation was issued. */
    consumptionRate: number;
    /** When the reservation expires and gets swept back to the lease. */
    expiresAt: Date;
    /**
     * Evaluation context used to issue this reservation. Threaded into the
     * Track event in `trackWithReservation` so the server can attribute usage
     * to the same company/user.
     */
    evalCtx: api.CheckFlagRequestBody;
}

/** Options accepted by `client.check`. */
export interface CheckOptions {
    /**
     * Quantity (in event units) to gate the check on — the check reserves
     * `usage × consumption_rate` credits from the lease. A check issues at
     * most ONE reservation, against a single event subtype.
     */
    usage?: number;
    /**
     * Event subtype the `usage` applies to (e.g. `"inference_tokens"`).
     * Disambiguates which credit condition to gate on when the flag meters
     * more than one event. Optional when the flag's credit condition is
     * unambiguous.
     */
    eventSubtype?: string;
    /**
     * What to do when a lease cannot be acquired (API error, store
     * unreachable, insufficient remote balance). Default: `fail-closed`
     * (`allowed = false`, no reservation) — deny when the gate can't gate.
     * Override to `fail-open` for trusted/known customers where letting
     * traffic through is preferable to a denial; the flag's rules are still
     * evaluated with an assumed-sufficient credit balance, so only the credit
     * gate is bypassed (see `OnAcquireFailure`).
     */
    onAcquireFailure?: OnAcquireFailure;
    /** Default value to return on error. */
    defaultValue?: boolean | (() => boolean);
    /** Custom timeout for API calls within this check (ms). */
    timeoutMs?: number;
}

/** Result of `client.check`. */
export interface CheckResult {
    /** Whether the caller is permitted to proceed. */
    allowed: boolean;
    /** Boolean flag value (`allowed` mirrors this in non-lease paths). */
    value: boolean;
    /** Reservation handle when a lease-bearing check passed. */
    reservation?: Reservation;
    /** Human-readable reason (from the rules engine or the SDK). */
    reason: string;
    /**
     * Entitlement payload from the check.
     *
     * NOTE: `entitlement.creditRemaining` (and `creditTotal` / `creditUsed`) is
     * NOT lease-aware and must not be used as a user-facing balance when credit
     * leases are enabled. The WASM derives those fields from the company's
     * server `creditBalances`, which a lease distorts: a plain `checkFlag` sees
     * the balance net of the whole lease tranche (reads low/~0), and a
     * lease-bearing `check()` sees the substituted *tranche-local* balance, not
     * the company total. For any "credits remaining" display use
     * `client.getCreditBalance(...).settled` (`B − spent`), which speaks the
     * server's `remaining`/`reserved`/`settled` vocabulary.
     */
    entitlement?: api.RulesengineFeatureEntitlement;
    /** Flag key checked. */
    flagKey: string;
    /** Flag ID if known. */
    flagId?: string;
    /** Optional error string (populated when the SDK fell back to a default). */
    err?: string;
}

/** Extras accepted by `trackWithReservation`. */
export interface TrackWithReservationOptions {
    /** Optional traits to attach to the emitted Track event. */
    traits?: Record<string, unknown>;
}
