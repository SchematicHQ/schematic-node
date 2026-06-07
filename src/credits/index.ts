export { LeaseStore, leaseKey, type LeaseEntry, type ILeaseStore } from "./lease-store";
export { ReservationStore, type IReservationStore } from "./reservation-store";
export { CreditLeaseManager } from "./lease-manager";
export { RedisLeaseStore } from "./redis-lease-store";
export { RedisReservationStore } from "./redis-reservation-store";
export {
    DEFAULT_LEASE_DURATION_MS,
    DEFAULT_LEASE_SIZE,
    DEFAULT_LOW_WATER_MARK,
    DEFAULT_PREWARM_POLL_INTERVAL_MS,
    DEFAULT_PREWARM_RESOLVE_TIMEOUT_MS,
    DEFAULT_RESERVATION_TTL_MS,
    DEFAULT_SWEEP_INTERVAL_MS,
} from "./types";
export type {
    CreditLeaseConfig,
    ResolvedLeaseConfig,
    Reservation,
    CheckOptions,
    CheckResult,
    OnAcquireFailure,
    TrackWithReservationOptions,
} from "./types";
