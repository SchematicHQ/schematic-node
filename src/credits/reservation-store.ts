import type { Reservation } from "./types";
import type { ILeaseStore } from "./lease-store";

/** Backing-store contract for the reservation table. */
export interface IReservationStore {
    add(reservation: Reservation): Promise<void> | void;
    get(id: string): Promise<Reservation | undefined> | Reservation | undefined;
    consume(id: string, creditsConsumed: number): Promise<number | null>;
    /**
     * Sum of `creditsReserved` across open reservations for a (company, credit).
     * These credits are carved out of the lease's `localRemainingCredits` but
     * aren't spent yet, so a balance display can add them back to ignore
     * in-flight holds.
     */
    reservedCredits(companyId: string, creditTypeId: string): Promise<number> | number;
    startSweep(): void;
    sweepExpired(now?: Date): Promise<number>;
    stop(): void;
    size(): Promise<number> | number;
}

/**
 * In-memory reservation table, paired with a sweep loop that returns expired
 * reservations to their underlying lease.
 *
 * For cross-pod deployments, swap this for `RedisReservationStore` — both
 * implement `IReservationStore`.
 */
export class ReservationStore implements IReservationStore {
    private reservations = new Map<string, Reservation>();
    private sweepInterval: NodeJS.Timeout | null = null;
    private stopped = false;

    constructor(
        private readonly leaseStore: ILeaseStore,
        private readonly sweepIntervalMs: number = 1000,
    ) {}

    /** Register a new reservation. Idempotent on `id`. */
    add(reservation: Reservation): void {
        this.reservations.set(reservation.id, reservation);
    }

    /** Look up a reservation by ID. */
    get(id: string): Reservation | undefined {
        return this.reservations.get(id);
    }

    /**
     * Sum open reservations for a (company, credit). Counts every reservation
     * still in the table: its credits stay carved out of the lease's
     * `localRemainingCredits` until `consume`/`sweepExpired` removes it and
     * refunds the unspent remainder in the same step, so summing by presence
     * keeps `localRemainingCredits + reservedCredits` exact.
     */
    reservedCredits(companyId: string, creditTypeId: string): number {
        let total = 0;
        for (const reservation of this.reservations.values()) {
            if (reservation.companyId === companyId && reservation.creditTypeId === creditTypeId) {
                total += reservation.creditsReserved;
            }
        }
        return total;
    }

    /**
     * Consume a reservation — removes it from the table and refunds
     * `creditsReserved - creditsConsumed` back to the underlying lease.
     * Returns the credits actually consumed (clamped to `creditsReserved`)
     * or `null` if the reservation is missing/already consumed.
     */
    async consume(id: string, creditsConsumed: number): Promise<number | null> {
        const reservation = this.reservations.get(id);
        if (!reservation) return null;
        this.reservations.delete(id);

        const actual = Math.max(0, Math.min(creditsConsumed, reservation.creditsReserved));
        const refund = reservation.creditsReserved - actual;
        if (refund > 0) {
            // Pinned to the originating lease: if that lease has expired and a
            // successor occupies the slot, the refund is dropped (the expired
            // lease's remainder was already returned server-side).
            await this.leaseStore.refund(reservation.companyId, reservation.creditTypeId, refund, reservation.leaseId);
        }
        return actual;
    }

    /** Start the background sweep loop. Safe to call repeatedly. */
    startSweep(): void {
        if (this.sweepInterval || this.stopped) return;
        this.sweepInterval = setInterval(() => {
            this.sweepExpired().catch(() => {
                // sweepExpired only throws on programmer error; swallow so the
                // timer keeps running.
            });
        }, this.sweepIntervalMs);
        if (this.sweepInterval.unref) this.sweepInterval.unref();
    }

    /**
     * Scan for expired reservations, remove them, and refund their credits to
     * the lease.
     */
    async sweepExpired(now: Date = new Date()): Promise<number> {
        let swept = 0;
        for (const [id, reservation] of this.reservations) {
            if (reservation.expiresAt.getTime() <= now.getTime()) {
                this.reservations.delete(id);
                await this.leaseStore.refund(
                    reservation.companyId,
                    reservation.creditTypeId,
                    reservation.creditsReserved,
                    reservation.leaseId,
                );
                swept++;
            }
        }
        return swept;
    }

    /** Stop the sweep loop. */
    stop(): void {
        this.stopped = true;
        if (this.sweepInterval) {
            clearInterval(this.sweepInterval);
            this.sweepInterval = null;
        }
    }

    /** Test/debug: current reservation count. */
    size(): number {
        return this.reservations.size;
    }
}
