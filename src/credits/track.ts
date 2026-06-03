import * as api from "../api";

import type { IReservationStore } from "./reservation-store";
import type { Reservation, TrackWithReservationOptions } from "./types";

/** Outcome of consuming a reservation and building its Track event. */
export interface ReservationConsumeResult {
    /** The Track event to emit. Always carries the `leaseId`. */
    track: api.EventBodyTrack;
    /**
     * `true` when the reservation was still live and `consume` debited/refunded
     * the local lease in this call. `false` when the reservation was already
     * gone from the store (swept after its TTL, or already consumed): the local
     * lease balance was *not* touched here, and the returned `track` is a
     * recovery event so the server still bills the actual usage. The caller is
     * responsible for de-duping recovery emits (see `trackWithReservation`).
     */
    settledLocally: boolean;
}

/**
 * Build the `EventBodyTrack` payload for a Track event that consumes a
 * reservation, and consume the reservation against the lease (refunding the
 * unused slice locally).
 *
 * The Track is built from the caller-held `reservation` handle, so it can be
 * emitted even when the reservation has already been swept out of the store —
 * the server is the source of truth for actual consumption. When the lease is
 * still live server-side the `leaseId` routes the spend through its sub-ledger;
 * when the server lease has itself expired/released, the server falls through
 * to a direct grant decrement. Either way the usage is billed, so a hold that
 * outlives its (client-side) reservation TTL is no longer dropped on the floor.
 *
 * On the recovery path (`settledLocally: false`) the sweeper already refunded
 * the full hold and nothing re-debits the consumed slice, so the local lease
 * reads high until rollover — hence `reservationTTL` should exceed the longest
 * expected work duration (see `CreditLeaseConfig.defaultReservationTTL`).
 */
export async function consumeReservationAndBuildEvent(
    reservations: IReservationStore,
    reservation: Reservation,
    actualQuantity: number,
    options?: TrackWithReservationOptions,
): Promise<ReservationConsumeResult> {
    const credits = actualQuantity * reservation.consumptionRate;
    const consumed = await reservations.consume(reservation.id, credits);
    return {
        track: buildReservationTrackEvent(reservation, actualQuantity, options),
        settledLocally: consumed !== null,
    };
}

/**
 * Build the Track event for a reservation purely from the caller-held handle —
 * no store access. Split out so `trackWithReservation` can still emit the
 * billing event when the local settle (`consume`) fails on an unreachable
 * store: the server is the source of truth for actual consumption, so the
 * usage must be reported regardless of local bookkeeping.
 */
export function buildReservationTrackEvent(
    reservation: Reservation,
    actualQuantity: number,
    options?: TrackWithReservationOptions,
): api.EventBodyTrack {
    const body: api.EventBodyTrack = {
        event: reservation.eventSubtype,
        quantity: actualQuantity,
        // Routes the server-side credit consumption through the lease's
        // sub-ledger instead of decrementing the grant again (which was
        // already pre-debited at acquire/extend). Without this the grant
        // double-debits and eventually starves redemptions mid-session.
        leaseId: reservation.leaseId,
    };
    if (reservation.evalCtx.company) {
        body.company = reservation.evalCtx.company;
    }
    if (reservation.evalCtx.user) {
        body.user = reservation.evalCtx.user;
    }
    if (options?.traits) {
        body.traits = options.traits;
    }
    return body;
}
