import { RedisLeaseStore } from "../../../src/credits/redis-lease-store";
import { makeFakeRedis } from "./fake-redis";

describe("RedisLeaseStore", () => {
    it("replace installs a fresh lease, returns true", async () => {
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client });
        const wrote = await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        expect(wrote).toBe(true);
        const entry = await store.get("co_1", "ct_1");
        expect(entry?.leaseId).toBe("lse_1");
        expect(entry?.localRemainingCredits).toBe(100);
        expect(entry?.grantedAmount).toBe(100);
    });

    it("replace preserves debited state when the same live leaseId is rewritten", async () => {
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client });
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await store.tryReserve("co_1", "ct_1", 400);
        // Simulate a second pod calling acquire and getting the same lease back.
        const wrote = await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        expect(wrote).toBe(false);
        const entry = await store.get("co_1", "ct_1");
        expect(entry?.localRemainingCredits).toBe(600);
    });

    it("tryReserve atomically gates against the shared balance", async () => {
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client });
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        const results = await Promise.all([
            store.tryReserve("co_1", "ct_1", 40),
            store.tryReserve("co_1", "ct_1", 40),
            store.tryReserve("co_1", "ct_1", 40),
        ]);
        // Two should succeed, one should fail (40 left after two debits).
        // Successes return the post-debit balance; failures return null.
        const successes = results.filter((r) => r !== null).sort((a, b) => (a ?? 0) - (b ?? 0));
        expect(successes).toEqual([20, 60]);
        const entry = await store.get("co_1", "ct_1");
        expect(entry?.localRemainingCredits).toBe(20);
    });

    it("tryReserve rejects an expired-but-not-yet-evicted lease", async () => {
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client });
        // Expiry is in the past, but the TTL grace keeps the row alive in Redis.
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() - 1_000),
        });
        // Row still present (within grace window)...
        expect(await store.get("co_1", "ct_1")).toBeDefined();
        // ...but the expiry guard refuses to reserve against stale balance.
        const result = await store.tryReserve("co_1", "ct_1", 10);
        expect(result).toBeNull();
        expect((await store.get("co_1", "ct_1"))?.localRemainingCredits).toBe(100);
    });

    it("tryReserve rejects NaN and negative debits before they reach the script", async () => {
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client });
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        // `String(NaN)` parses back to nan in Lua and would poison the SHARED
        // balance for every pod; the guard rejects it client-side.
        expect(await store.tryReserve("co_1", "ct_1", Number.NaN)).toBeNull();
        expect(await store.tryReserve("co_1", "ct_1", -10)).toBeNull();
        expect((await store.get("co_1", "ct_1"))?.localRemainingCredits).toBe(100);
        // The lease still gates correctly afterwards.
        expect(await store.tryReserve("co_1", "ct_1", 30)).toBe(70);
    });

    it("refund caps at grantedAmount", async () => {
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client });
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await store.tryReserve("co_1", "ct_1", 30);
        await store.refund("co_1", "ct_1", 9999);
        const entry = await store.get("co_1", "ct_1");
        expect(entry?.localRemainingCredits).toBe(100);
    });

    it("refund pinned to a stale leaseId is dropped; matching leaseId applies", async () => {
        // Models a reservation taken from lease A whose slot has since been
        // replaced by lease B: A's refund must not inflate B's balance.
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client });
        await store.replace({
            leaseId: "lse_b",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await store.tryReserve("co_1", "ct_1", 50);
        await store.refund("co_1", "ct_1", 30, "lse_a");
        expect((await store.get("co_1", "ct_1"))?.localRemainingCredits).toBe(50);
        await store.refund("co_1", "ct_1", 30, "lse_b");
        expect((await store.get("co_1", "ct_1"))?.localRemainingCredits).toBe(80);
    });

    it("replace keeps a DIFFERENT live lease id, preserving its debited balance", async () => {
        // Models two pods racing the first acquire for the same slot: the loser
        // must not clobber the winner's already-debited balance.
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client });
        await store.replace({
            leaseId: "lse_winner",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await store.tryReserve("co_1", "ct_1", 400);
        const wrote = await store.replace({
            leaseId: "lse_loser",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        expect(wrote).toBe(false);
        const entry = await store.get("co_1", "ct_1");
        expect(entry?.leaseId).toBe("lse_winner");
        expect(entry?.localRemainingCredits).toBe(600);
    });

    it("extend honors defaultLeaseDurationMs option when newExpiresAt is omitted", async () => {
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client, defaultLeaseDurationMs: 250 });
        // Short initial expiry so the fallback (now + 250ms) is a *forward*
        // move — expiry never moves backwards.
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 100),
        });
        const before = Date.now();
        await store.extend("co_1", "ct_1", 150);
        const entry = await store.get("co_1", "ct_1");
        // Configured fallback is 250ms — expiry should land near `before + 250`.
        const expiry = entry?.expiresAt.getTime() ?? 0;
        expect(expiry).toBeGreaterThanOrEqual(before + 200);
        expect(expiry).toBeLessThanOrEqual(before + 500);
        expect(entry?.grantedAmount).toBe(150);
    });

    it("extend pinned to a stale leaseId is dropped; matching leaseId applies", async () => {
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client });
        // Successor lease B occupies the slot (A expired mid-extend and was replaced).
        await store.replace({
            leaseId: "lse_B",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });

        // A's extend lands late: pinned to lse_A, it must not credit B.
        await store.extend("co_1", "ct_1", 150, new Date(Date.now() + 120_000), "lse_A");
        let entry = await store.get("co_1", "ct_1");
        expect(entry?.grantedAmount).toBe(100);
        expect(entry?.localRemainingCredits).toBe(100);

        // Pinned to the live lease, the extend applies.
        await store.extend("co_1", "ct_1", 150, new Date(Date.now() + 120_000), "lse_B");
        entry = await store.get("co_1", "ct_1");
        expect(entry?.grantedAmount).toBe(150);
        expect(entry?.localRemainingCredits).toBe(150);
    });

    it("concurrent sibling-pod extends converge on the server total instead of double-counting", async () => {
        const client = makeFakeRedis();
        // Two pods sharing one Redis backend. Per-process single-flight can't
        // serialize their extends, so both wire calls go out against the same
        // stale local read (granted=100); the server lands B's first (total
        // 150) then A's (total 200). Each pod applies the TOTAL the server
        // returned — the slot must converge on 200, never 250 (the delta-apply
        // double-count this regression test pins down).
        const podA = new RedisLeaseStore({ client });
        const podB = new RedisLeaseStore({ client });
        await podA.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await podB.extend("co_1", "ct_1", 150, new Date(Date.now() + 90_000), "lse_1");
        await podA.extend("co_1", "ct_1", 200, new Date(Date.now() + 120_000), "lse_1");
        let entry = await podA.get("co_1", "ct_1");
        expect(entry?.grantedAmount).toBe(200);
        expect(entry?.localRemainingCredits).toBe(200);

        // Out-of-order arrival: the larger total lands first, the superseded
        // one applies as a no-op — and never pulls the expiry backwards.
        await podA.replace({
            leaseId: "lse_2",
            companyId: "co_1",
            creditTypeId: "ct_2",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        const farExpiry = new Date(Date.now() + 120_000);
        await podA.extend("co_1", "ct_2", 200, farExpiry, "lse_2");
        await podB.extend("co_1", "ct_2", 150, new Date(Date.now() + 90_000), "lse_2");
        entry = await podA.get("co_1", "ct_2");
        expect(entry?.grantedAmount).toBe(200);
        expect(entry?.localRemainingCredits).toBe(200);
        expect(entry?.expiresAt.getTime()).toBe(farExpiry.getTime());
    });

    it("drop removes the lease hash", async () => {
        const client = makeFakeRedis();
        const store = new RedisLeaseStore({ client });
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await store.drop("co_1", "ct_1");
        expect(await store.get("co_1", "ct_1")).toBeUndefined();
    });
});
