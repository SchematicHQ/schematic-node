import { LeaseStore } from "../../../src/credits/lease-store";
import { ReservationStore } from "../../../src/credits/reservation-store";
import type { Reservation } from "../../../src/credits/types";

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
    return {
        id: "res_1",
        leaseId: "lse_1",
        companyId: "co_1",
        creditTypeId: "ct_1",
        eventSubtype: "inference_tokens",
        quantityReserved: 10,
        creditsReserved: 100,
        consumptionRate: 10,
        expiresAt: new Date(Date.now() + 60_000),
        evalCtx: { company: { id: "co_1" } },
        ...overrides,
    };
}

describe("ReservationStore", () => {
    let leases: LeaseStore;
    let reservations: ReservationStore;

    beforeEach(async () => {
        leases = new LeaseStore();
        reservations = new ReservationStore(leases, 50);
        await leases.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
    });

    afterEach(() => {
        reservations.stop();
    });

    it("consume refunds unused credits to the lease", async () => {
        await leases.tryReserve("co_1", "ct_1", 100);
        const reservation = makeReservation();
        reservations.add(reservation);
        expect(leases.get("co_1", "ct_1")?.localRemainingCredits).toBe(900);

        const consumed = await reservations.consume(reservation.id, 30);
        expect(consumed).toBe(30);
        // Refunded 100 - 30 = 70
        expect(leases.get("co_1", "ct_1")?.localRemainingCredits).toBe(970);
        expect(reservations.get(reservation.id)).toBeUndefined();
    });

    it("does not refund a reservation from an old lease into a successor lease", async () => {
        await leases.tryReserve("co_1", "ct_1", 100);
        const reservation = makeReservation({ expiresAt: new Date(Date.now() - 1) });
        reservations.add(reservation);

        // Lease lse_1 expires; a successor lse_2 takes the slot, partially debited.
        await leases.drop("co_1", "ct_1");
        await leases.replace({
            leaseId: "lse_2",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await leases.tryReserve("co_1", "ct_1", 200);

        // Sweeping the expired lse_1 reservation must not inflate lse_2: its
        // unspent slice was already returned to the company balance when lse_1
        // expired server-side.
        await reservations.sweepExpired();
        expect(leases.get("co_1", "ct_1")?.localRemainingCredits).toBe(800);
        // Same for an explicit consume of a stale-lease reservation.
        const reservation2 = makeReservation({ id: "res_2", expiresAt: new Date(Date.now() + 60_000) });
        reservations.add(reservation2);
        await reservations.consume(reservation2.id, 0);
        expect(leases.get("co_1", "ct_1")?.localRemainingCredits).toBe(800);
    });

    it("consume clamps credits consumed to creditsReserved", async () => {
        await leases.tryReserve("co_1", "ct_1", 100);
        const reservation = makeReservation();
        reservations.add(reservation);
        const consumed = await reservations.consume(reservation.id, 999);
        expect(consumed).toBe(100);
        expect(leases.get("co_1", "ct_1")?.localRemainingCredits).toBe(900);
    });

    it("consume returns null on missing reservation", async () => {
        const result = await reservations.consume("nope", 10);
        expect(result).toBeNull();
    });

    it("sweepExpired refunds expired reservations to the lease", async () => {
        await leases.tryReserve("co_1", "ct_1", 100);
        const reservation = makeReservation({ expiresAt: new Date(Date.now() - 1) });
        reservations.add(reservation);

        const swept = await reservations.sweepExpired();
        expect(swept).toBe(1);
        expect(reservations.get(reservation.id)).toBeUndefined();
        expect(leases.get("co_1", "ct_1")?.localRemainingCredits).toBe(1000);
    });

    it("sweepExpired ignores non-expired reservations", async () => {
        await leases.tryReserve("co_1", "ct_1", 100);
        reservations.add(makeReservation());
        const swept = await reservations.sweepExpired();
        expect(swept).toBe(0);
        expect(reservations.size()).toBe(1);
    });

    it("reservedCredits sums open reservations for a (company, credit)", async () => {
        reservations.add(makeReservation({ id: "res_1", creditsReserved: 100 }));
        reservations.add(makeReservation({ id: "res_2", creditsReserved: 250 }));
        // Different credit / company shouldn't count.
        reservations.add(makeReservation({ id: "res_3", creditTypeId: "ct_2", creditsReserved: 999 }));
        reservations.add(makeReservation({ id: "res_4", companyId: "co_2", creditsReserved: 999 }));

        expect(reservations.reservedCredits("co_1", "ct_1")).toBe(350);
        expect(reservations.reservedCredits("co_1", "ct_2")).toBe(999);
        expect(reservations.reservedCredits("co_unknown", "ct_1")).toBe(0);
    });

    it("reservedCredits drops a reservation once it is consumed", async () => {
        await leases.tryReserve("co_1", "ct_1", 100);
        reservations.add(makeReservation());
        expect(reservations.reservedCredits("co_1", "ct_1")).toBe(100);

        await reservations.consume("res_1", 30);
        expect(reservations.reservedCredits("co_1", "ct_1")).toBe(0);
    });
});
