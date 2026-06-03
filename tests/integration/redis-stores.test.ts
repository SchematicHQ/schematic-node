/**
 * Integration tests for the Redis-backed lease + reservation stores against a
 * REAL redis-server — the only place the Lua scripts are executed as Lua.
 *
 * The unit suite exercises these stores against `fake-redis`, which matches
 * each script by substring and re-implements its semantics in JS; a Lua syntax
 * error or a semantic drift between script and fake would ship green there.
 * This suite is the backstop: it runs the actual scripts (including the
 * `redis.call('TIME')` server-clock read and the string-vs-integer reply
 * conversions) under real concurrency.
 *
 * Opt-in: set TEST_REDIS_URL (e.g. redis://localhost:6379) to enable. CI runs
 * it against a redis service container; locally the suite skips when unset so
 * `yarn test` stays dependency-free.
 */
import { randomUUID } from "crypto";

import { createClient } from "redis";

import type { RedisClient } from "../../src/cache/redis";
import { RedisLeaseStore } from "../../src/credits/redis-lease-store";
import { RedisReservationStore } from "../../src/credits/redis-reservation-store";
import type { Reservation } from "../../src/credits/types";

const REDIS_URL = process.env.TEST_REDIS_URL;
const describeIf = REDIS_URL ? describe : describe.skip;

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
    return {
        id: randomUUID(),
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

describeIf("Redis stores against a real redis-server", () => {
    jest.setTimeout(15_000);

    let rawClient: ReturnType<typeof createClient>;
    let client: RedisClient;
    // Unique prefix per run so concurrent/leftover runs can't interfere; all
    // keys are swept in afterAll.
    const keyPrefix = `schematic-test:${randomUUID()}:`;

    beforeAll(async () => {
        rawClient = createClient({ url: REDIS_URL });
        await rawClient.connect();
        client = rawClient as unknown as RedisClient;
    });

    afterAll(async () => {
        if (!rawClient?.isOpen) return;
        const stale: string[] = [];
        for await (const key of rawClient.scanIterator({ MATCH: `${keyPrefix}*`, COUNT: 100 })) {
            stale.push(key);
        }
        if (stale.length > 0) await rawClient.del(stale);
        await rawClient.quit();
    });

    function makeLeaseStore(): RedisLeaseStore {
        return new RedisLeaseStore({ client, keyPrefix });
    }

    function makeStores(): { leaseStore: RedisLeaseStore; reservations: RedisReservationStore } {
        const leaseStore = makeLeaseStore();
        const reservations = new RedisReservationStore({ client, leaseStore, sweepIntervalMs: 60_000, keyPrefix });
        return { leaseStore, reservations };
    }

    async function installLease(
        leaseStore: RedisLeaseStore,
        opts: { creditTypeId?: string; leaseId?: string; grantedAmount?: number; expiresAt?: Date } = {},
    ): Promise<string> {
        const creditTypeId = opts.creditTypeId ?? `ct_${randomUUID()}`;
        const wrote = await leaseStore.replace({
            leaseId: opts.leaseId ?? "lse_1",
            companyId: "co_1",
            creditTypeId,
            grantedAmount: opts.grantedAmount ?? 100,
            expiresAt: opts.expiresAt ?? new Date(Date.now() + 60_000),
        });
        expect(wrote).toBe(true);
        return creditTypeId;
    }

    it("replace round-trips, keeps a live lease, and overwrites an expired one", async () => {
        const leaseStore = makeLeaseStore();
        const creditTypeId = await installLease(leaseStore, { leaseId: "lse_a", grantedAmount: 100 });
        expect(await leaseStore.tryReserve("co_1", creditTypeId, 40)).toBe(60);

        // A racing acquire must not clobber the live, partially-debited lease.
        const wroteOverLive = await leaseStore.replace({
            leaseId: "lse_b",
            companyId: "co_1",
            creditTypeId,
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        expect(wroteOverLive).toBe(false);
        let entry = await leaseStore.get("co_1", creditTypeId);
        expect(entry?.leaseId).toBe("lse_a");
        expect(entry?.localRemainingCredits).toBe(60);

        // An expired slot is fair game (expiry judged by the Redis server clock).
        await client.hSet(leaseStore.hashKey("co_1", creditTypeId), "expiresAt", String(Date.now() - 1_000));
        const wroteOverExpired = await leaseStore.replace({
            leaseId: "lse_b",
            companyId: "co_1",
            creditTypeId,
            grantedAmount: 200,
            expiresAt: new Date(Date.now() + 60_000),
        });
        expect(wroteOverExpired).toBe(true);
        entry = await leaseStore.get("co_1", creditTypeId);
        expect(entry?.leaseId).toBe("lse_b");
        expect(entry?.localRemainingCredits).toBe(200);
    });

    it("tryReserve under contention admits exactly the available balance", async () => {
        const leaseStore = makeLeaseStore();
        const creditTypeId = await installLease(leaseStore, { grantedAmount: 100 });

        // 25 concurrent reserves of 10 against 100: exactly 10 may win.
        const results = await Promise.all(
            Array.from({ length: 25 }, () => leaseStore.tryReserve("co_1", creditTypeId, 10)),
        );
        const successes = results.filter((r): r is number => r !== null);
        expect(successes).toHaveLength(10);
        // Each success returns the post-debit balance: one distinct step each.
        expect([...successes].sort((a, b) => a - b)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
        expect((await leaseStore.get("co_1", creditTypeId))?.localRemainingCredits).toBe(0);
    });

    it("tryReserve preserves fractional balances across the string reply", async () => {
        // A Lua number reply truncates to integer — the script must return the
        // balance as a string for fractional consumption rates to survive.
        const leaseStore = makeLeaseStore();
        const creditTypeId = await installLease(leaseStore, { grantedAmount: 10 });
        expect(await leaseStore.tryReserve("co_1", creditTypeId, 0.5)).toBe(9.5);
        expect((await leaseStore.get("co_1", creditTypeId))?.localRemainingCredits).toBe(9.5);
    });

    it("tryReserve rejects an expired-but-not-yet-evicted lease (TTL grace window)", async () => {
        const leaseStore = makeLeaseStore();
        const creditTypeId = await installLease(leaseStore, { expiresAt: new Date(Date.now() + 150) });
        await new Promise((r) => setTimeout(r, 250));
        // Row still present (grace keeps it for the sweeper)...
        expect(await leaseStore.get("co_1", creditTypeId)).toBeDefined();
        // ...but the server-clock expiry guard refuses to reserve against it.
        expect(await leaseStore.tryReserve("co_1", creditTypeId, 10)).toBeNull();
    });

    it("refund clamps at grantedAmount and honors the leaseId pin", async () => {
        const leaseStore = makeLeaseStore();
        const creditTypeId = await installLease(leaseStore, { leaseId: "lse_live", grantedAmount: 100 });
        expect(await leaseStore.tryReserve("co_1", creditTypeId, 50)).toBe(50);

        // Pinned to a stale lease: dropped.
        await leaseStore.refund("co_1", creditTypeId, 30, "lse_stale");
        expect((await leaseStore.get("co_1", creditTypeId))?.localRemainingCredits).toBe(50);
        // Pinned to the live lease: applies.
        await leaseStore.refund("co_1", creditTypeId, 30, "lse_live");
        expect((await leaseStore.get("co_1", creditTypeId))?.localRemainingCredits).toBe(80);
        // Clamped at grantedAmount.
        await leaseStore.refund("co_1", creditTypeId, 9_999);
        expect((await leaseStore.get("co_1", creditTypeId))?.localRemainingCredits).toBe(100);
    });

    it("extend reconciles to the server total and honors the leaseId pin", async () => {
        const leaseStore = makeLeaseStore();
        const creditTypeId = await installLease(leaseStore, { leaseId: "lse_live", grantedAmount: 100 });

        // Pinned to a stale lease: dropped.
        await leaseStore.extend("co_1", creditTypeId, 150, new Date(Date.now() + 120_000), "lse_stale");
        let entry = await leaseStore.get("co_1", creditTypeId);
        expect(entry?.grantedAmount).toBe(100);

        // Pinned to the live lease: reconciles to the total (credits the delta).
        const farExpiry = new Date(Date.now() + 120_000);
        await leaseStore.extend("co_1", creditTypeId, 150, farExpiry, "lse_live");
        entry = await leaseStore.get("co_1", creditTypeId);
        expect(entry?.grantedAmount).toBe(150);
        expect(entry?.localRemainingCredits).toBe(150);

        // A concurrent sibling's superseded total is a no-op — no
        // double-counted delta, and the expiry never moves backwards.
        await leaseStore.extend("co_1", creditTypeId, 120, new Date(Date.now() + 60_000), "lse_live");
        entry = await leaseStore.get("co_1", creditTypeId);
        expect(entry?.grantedAmount).toBe(150);
        expect(entry?.localRemainingCredits).toBe(150);
        expect(entry?.expiresAt.getTime()).toBe(farExpiry.getTime());
    });

    it("concurrent consumes settle a reservation exactly once", async () => {
        const { leaseStore, reservations } = makeStores();
        const creditTypeId = await installLease(leaseStore, { grantedAmount: 1_000 });
        expect(await leaseStore.tryReserve("co_1", creditTypeId, 100)).toBe(900);
        const reservation = makeReservation({ creditTypeId });
        await reservations.add(reservation);

        // Five racing settles (e.g. a Track racing sweepers): the CLAIM script
        // arbitrates — exactly one wins and refunds the unused slice once.
        const results = await Promise.all(Array.from({ length: 5 }, () => reservations.consume(reservation.id, 60)));
        expect(results.filter((r) => r !== null)).toEqual([60]);
        // 40 unused credits refunded exactly once: 900 + 40.
        expect((await leaseStore.get("co_1", creditTypeId))?.localRemainingCredits).toBe(940);
        expect(await reservations.reservedCredits("co_1", creditTypeId)).toBe(0);
        reservations.stop();
    });

    it("sweepExpired refunds expired holds and cleans both indexes", async () => {
        const { leaseStore, reservations } = makeStores();
        const creditTypeId = await installLease(leaseStore, { grantedAmount: 1_000 });
        expect(await leaseStore.tryReserve("co_1", creditTypeId, 300)).toBe(700);
        for (let i = 0; i < 3; i++) {
            await reservations.add(
                makeReservation({ creditTypeId, creditsReserved: 100, expiresAt: new Date(Date.now() - 1) }),
            );
        }
        expect(await reservations.reservedCredits("co_1", creditTypeId)).toBe(300);

        const swept = await reservations.sweepExpired();
        expect(swept).toBe(3);
        expect((await leaseStore.get("co_1", creditTypeId))?.localRemainingCredits).toBe(1_000);
        expect(await reservations.size()).toBe(0);
        expect(await reservations.reservedCredits("co_1", creditTypeId)).toBe(0);
        reservations.stop();
    });
});
