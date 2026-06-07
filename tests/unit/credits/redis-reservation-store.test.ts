import { RedisLeaseStore } from "../../../src/credits/redis-lease-store";
import { RedisReservationStore } from "../../../src/credits/redis-reservation-store";
import type { Reservation } from "../../../src/credits/types";
import { makeFakeRedis } from "./fake-redis";

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

describe("RedisReservationStore", () => {
    it("add round-trips through get and shows up in the expiry index", async () => {
        const client = makeFakeRedis();
        const leaseStore = new RedisLeaseStore({ client });
        const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000 });
        await leaseStore.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });

        const reservation = makeReservation();
        await reservations.add(reservation);
        const fetched = await reservations.get(reservation.id);
        expect(fetched?.creditsReserved).toBe(100);
        expect(await reservations.size()).toBe(1);
        reservations.stop();
    });

    it("consume refunds unused credits atomically", async () => {
        const client = makeFakeRedis();
        const leaseStore = new RedisLeaseStore({ client });
        const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000 });
        await leaseStore.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await leaseStore.tryReserve("co_1", "ct_1", 100);
        await reservations.add(makeReservation());
        expect((await leaseStore.get("co_1", "ct_1"))?.localRemainingCredits).toBe(900);

        const consumed = await reservations.consume("res_1", 30);
        expect(consumed).toBe(30);
        // Refunded 100-30=70
        expect((await leaseStore.get("co_1", "ct_1"))?.localRemainingCredits).toBe(970);
        expect(await reservations.get("res_1")).toBeUndefined();
        reservations.stop();
    });

    it("sweepExpired returns expired reservations to the lease", async () => {
        const client = makeFakeRedis();
        const leaseStore = new RedisLeaseStore({ client });
        const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000 });
        await leaseStore.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await leaseStore.tryReserve("co_1", "ct_1", 100);
        await reservations.add(makeReservation({ expiresAt: new Date(Date.now() - 1) }));

        const swept = await reservations.sweepExpired();
        expect(swept).toBe(1);
        expect((await leaseStore.get("co_1", "ct_1"))?.localRemainingCredits).toBe(1000);
        expect(await reservations.get("res_1")).toBeUndefined();
        reservations.stop();
    });

    it("does not refund a reservation from an old lease into a successor lease", async () => {
        const client = makeFakeRedis();
        const leaseStore = new RedisLeaseStore({ client });
        const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000 });
        // Reservation carved out of lse_1...
        await leaseStore.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await leaseStore.tryReserve("co_1", "ct_1", 100);
        await reservations.add(makeReservation({ expiresAt: new Date(Date.now() - 1) }));

        // ...but the slot has since been replaced by lse_2, partially debited.
        await leaseStore.drop("co_1", "ct_1");
        await leaseStore.replace({
            leaseId: "lse_2",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await leaseStore.tryReserve("co_1", "ct_1", 200);

        // The sweep claims the reservation but its refund (pinned to lse_1)
        // must not inflate lse_2's balance.
        const swept = await reservations.sweepExpired();
        expect(swept).toBe(1);
        expect((await leaseStore.get("co_1", "ct_1"))?.localRemainingCredits).toBe(800);
        expect(await reservations.get("res_1")).toBeUndefined();
        reservations.stop();
    });

    it("reservedCredits sums open reservations and drops consumed ones", async () => {
        const client = makeFakeRedis();
        const leaseStore = new RedisLeaseStore({ client });
        const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000 });
        await leaseStore.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await leaseStore.tryReserve("co_1", "ct_1", 350);
        await reservations.add(makeReservation({ id: "res_1", creditsReserved: 100 }));
        await reservations.add(makeReservation({ id: "res_2", creditsReserved: 250 }));
        // Different credit shouldn't count toward ct_1.
        await reservations.add(makeReservation({ id: "res_3", creditTypeId: "ct_2", creditsReserved: 999 }));

        expect(await reservations.reservedCredits("co_1", "ct_1")).toBe(350);
        expect(await reservations.reservedCredits("co_1", "ct_2")).toBe(999);

        await reservations.consume("res_1", 40);
        expect(await reservations.reservedCredits("co_1", "ct_1")).toBe(250);
        reservations.stop();
    });

    it("never issues a multi-key Lua EVAL (Cluster-safe: no CROSSSLOT)", async () => {
        // A multi-key script whose keys hash to different slots raises CROSSSLOT
        // on Redis Cluster. Guard that every EVAL the lease + reservation stores
        // send touches exactly one key, across the full lifecycle.
        const base = makeFakeRedis();
        const evalKeyCounts: number[] = [];
        const client = {
            ...base,
            eval: (script: string, options: { keys: string[]; arguments: string[] }) => {
                evalKeyCounts.push(options.keys.length);
                return base.eval(script, options);
            },
        } as typeof base;

        const leaseStore = new RedisLeaseStore({ client });
        const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000 });

        // Exercise every Lua path: replace, tryReserve, refund, extend (lease)
        // and add, consume, sweep (reservation, whose refund delegates to the
        // lease store's single-key REFUND).
        await leaseStore.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await leaseStore.tryReserve("co_1", "ct_1", 200);
        await leaseStore.refund("co_1", "ct_1", 50);
        await leaseStore.extend("co_1", "ct_1", 100, new Date(Date.now() + 120_000));
        await reservations.add(makeReservation({ id: "res_a", creditsReserved: 100 }));
        await reservations.add(
            makeReservation({ id: "res_b", creditsReserved: 80, expiresAt: new Date(Date.now() - 1) }),
        );
        await reservations.consume("res_a", 40);
        await reservations.sweepExpired();

        expect(evalKeyCounts.length).toBeGreaterThan(0);
        expect(evalKeyCounts.every((n) => n === 1)).toBe(true);
        reservations.stop();
    });

    it("sweep reconciles orphaned indexes when the reservation hash TTL-evicts before sweeping", async () => {
        // Reproduces the failure mode where a sweeper goes silent (deploy/restart,
        // event-loop starvation) long enough for Redis to evict the reservation
        // hash via its TTL grace. Before the fix, the sweeper's `consume` would
        // hit the hash-gone path and never clean the byExpiry set or the per-tenant
        // `byCredit` hash — orphaning the index entry (unbounded zset growth) and
        // permanently inflating `reservedCredits`.
        jest.useFakeTimers();
        try {
            const t0 = new Date("2026-01-01T00:00:00Z").getTime();
            jest.setSystemTime(t0);

            const client = makeFakeRedis();
            const leaseStore = new RedisLeaseStore({ client });
            const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000 });
            await leaseStore.replace({
                leaseId: "lse_1",
                companyId: "co_1",
                creditTypeId: "ct_1",
                grantedAmount: 1000,
                expiresAt: new Date(t0 + 10 * 60_000),
            });
            await leaseStore.tryReserve("co_1", "ct_1", 100);
            // Reservation expires in 1s; its hash is reaped 30s (RES_TTL_GRACE_MS)
            // later. The lease lives well past both.
            await reservations.add(makeReservation({ expiresAt: new Date(t0 + 1000) }));
            expect(await reservations.size()).toBe(1);
            expect(await reservations.reservedCredits("co_1", "ct_1")).toBe(100);

            // Jump past the hash's TTL grace (but not the lease) so Redis would
            // have evicted only the reservation hash.
            jest.setSystemTime(t0 + 1000 + 30_000 + 1);

            const swept = await reservations.sweepExpired();
            // Nothing is "swept" in the refund sense — the hash is already gone, so
            // the unspent slice is left for server-side lease expiry to reclaim.
            expect(swept).toBe(0);
            // But the orphaned secondary indexes are reconciled: no tombstone left
            // in the expiry set, and reservedCredits no longer counts the evicted
            // hold (this is what regressed before the fix).
            expect(await reservations.size()).toBe(0);
            expect(await reservations.reservedCredits("co_1", "ct_1")).toBe(0);
            reservations.stop();
        } finally {
            jest.useRealTimers();
        }
    });

    it("sweep drops an unparseable index member instead of wedging", async () => {
        // Only `add` writes index members, so this shouldn't happen — but a
        // member that doesn't decode must be removed from the set rather than
        // re-read by every subsequent sweep.
        const client = makeFakeRedis();
        const leaseStore = new RedisLeaseStore({ client });
        const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000 });
        await client.zAdd("schematic:credit-reservations:byExpiry", { score: Date.now() - 1, value: "garbage" });

        const swept = await reservations.sweepExpired();
        expect(swept).toBe(0);
        expect(await reservations.size()).toBe(0);
        reservations.stop();
    });

    it("sweep pages through a large backlog with LIMIT batches", async () => {
        const client = makeFakeRedis();
        const leaseStore = new RedisLeaseStore({ client });
        const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000 });
        await leaseStore.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100_000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        // More expired holds than one SWEEP_BATCH_SIZE page (256).
        const count = 300;
        await leaseStore.tryReserve("co_1", "ct_1", count);
        for (let i = 0; i < count; i++) {
            await reservations.add(
                makeReservation({ id: `res_${i}`, creditsReserved: 1, expiresAt: new Date(Date.now() - 1) }),
            );
        }
        const swept = await reservations.sweepExpired();
        expect(swept).toBe(count);
        expect((await leaseStore.get("co_1", "ct_1"))?.localRemainingCredits).toBe(100_000);
        expect(await reservations.size()).toBe(0);
        expect(await reservations.reservedCredits("co_1", "ct_1")).toBe(0);
        reservations.stop();
    });

    it("double-consume returns null on the second call", async () => {
        const client = makeFakeRedis();
        const leaseStore = new RedisLeaseStore({ client });
        const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000 });
        await leaseStore.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await leaseStore.tryReserve("co_1", "ct_1", 100);
        await reservations.add(makeReservation());
        await reservations.consume("res_1", 50);
        const second = await reservations.consume("res_1", 10);
        expect(second).toBeNull();
        reservations.stop();
    });
});
