import { LeaseStore } from "../../../src/credits/lease-store";

describe("LeaseStore", () => {
    let store: LeaseStore;

    beforeEach(() => {
        store = new LeaseStore();
    });

    it("replaces installs a lease with localRemaining=grantedAmount", async () => {
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        const entry = store.get("co_1", "ct_1");
        expect(entry).toBeDefined();
        expect(entry?.localRemainingCredits).toBe(100);
        expect(entry?.grantedAmount).toBe(100);
    });

    it("tryReserve debits localRemaining and returns the post-debit balance on success", async () => {
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        const remaining = await store.tryReserve("co_1", "ct_1", 30);
        expect(remaining).toBe(70);
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(70);
    });

    it("tryReserve returns null when insufficient and does not debit", async () => {
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        const remaining = await store.tryReserve("co_1", "ct_1", 150);
        expect(remaining).toBeNull();
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(100);
    });

    it("tryReserve returns null against an expired lease and does not debit", async () => {
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() - 1_000),
        });
        const remaining = await store.tryReserve("co_1", "ct_1", 10);
        expect(remaining).toBeNull();
        // Balance untouched — an expired lease is stale, the server has released it.
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(100);
    });

    it("tryReserve rejects NaN and negative debits without poisoning the balance", async () => {
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        // NaN slips through `<` comparisons, so an unguarded debit would set
        // the balance to NaN and approve every subsequent reserve.
        expect(await store.tryReserve("co_1", "ct_1", Number.NaN)).toBeNull();
        expect(await store.tryReserve("co_1", "ct_1", -10)).toBeNull();
        expect(await store.tryReserve("co_1", "ct_1", Number.POSITIVE_INFINITY)).toBeNull();
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(100);
        // The lease still gates correctly afterwards.
        expect(await store.tryReserve("co_1", "ct_1", 30)).toBe(70);
        expect(await store.tryReserve("co_1", "ct_1", 80)).toBeNull();
    });

    it("refund adds credits back, capped at grantedAmount", async () => {
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await store.tryReserve("co_1", "ct_1", 30);
        await store.refund("co_1", "ct_1", 20);
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(90);
        // Refunding past grantedAmount caps at grantedAmount
        await store.refund("co_1", "ct_1", 9999);
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(100);
    });

    it("refund pinned to a stale leaseId is dropped; matching leaseId applies", async () => {
        // Successor lease occupies the slot, partially debited.
        await store.replace({
            leaseId: "lse_b",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await store.tryReserve("co_1", "ct_1", 50);
        // A refund carved out of the previous lease must not inflate lse_b.
        await store.refund("co_1", "ct_1", 30, "lse_a");
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(50);
        // The same refund pinned to the current lease applies normally.
        await store.refund("co_1", "ct_1", 30, "lse_b");
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(80);
    });

    it("concurrent tryReserves serialize and only succeed up to grantedAmount", async () => {
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
        const successes = results.filter((r) => r !== null).length;
        expect(successes).toBe(2);
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(20);
    });

    it("extend reconciles to the server total, crediting the delta and moving expiry forward", async () => {
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 10_000),
        });
        await store.tryReserve("co_1", "ct_1", 30);
        const newExpiry = new Date(Date.now() + 60_000);
        await store.extend("co_1", "ct_1", 150, newExpiry);
        const e = store.get("co_1", "ct_1");
        expect(e?.grantedAmount).toBe(150);
        expect(e?.localRemainingCredits).toBe(120);
        expect(e?.expiresAt.getTime()).toBe(newExpiry.getTime());
    });

    it("a stale extend total is a no-op and never shortens the expiry", async () => {
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 10_000),
        });
        // The larger server total lands first; a concurrent extend's smaller
        // (already-superseded) total must apply as a no-op rather than
        // re-crediting its delta, and must not pull the expiry backwards.
        const farExpiry = new Date(Date.now() + 120_000);
        await store.extend("co_1", "ct_1", 200, farExpiry);
        await store.extend("co_1", "ct_1", 150, new Date(Date.now() + 60_000));
        const e = store.get("co_1", "ct_1");
        expect(e?.grantedAmount).toBe(200);
        expect(e?.localRemainingCredits).toBe(200);
        expect(e?.expiresAt.getTime()).toBe(farExpiry.getTime());
    });

    it("extend pinned to a stale leaseId is dropped; matching leaseId applies", async () => {
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
        let e = store.get("co_1", "ct_1");
        expect(e?.grantedAmount).toBe(100);
        expect(e?.localRemainingCredits).toBe(100);

        // Pinned to the live lease, the extend applies.
        await store.extend("co_1", "ct_1", 150, new Date(Date.now() + 120_000), "lse_B");
        e = store.get("co_1", "ct_1");
        expect(e?.grantedAmount).toBe(150);
        expect(e?.localRemainingCredits).toBe(150);
    });

    it("drop removes the lease entry", async () => {
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await store.drop("co_1", "ct_1");
        expect(store.get("co_1", "ct_1")).toBeUndefined();
    });

    it("replace keeps an existing live lease (preserving its debited balance) and reports it did not write", async () => {
        const wroteFirst = await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        expect(wroteFirst).toBe(true);
        await store.tryReserve("co_1", "ct_1", 40);

        // A racing acquire installs a different lease id while the first is
        // still live — the existing debited balance must win.
        const wroteSecond = await store.replace({
            leaseId: "lse_2",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        expect(wroteSecond).toBe(false);
        const entry = store.get("co_1", "ct_1");
        expect(entry?.leaseId).toBe("lse_1");
        expect(entry?.localRemainingCredits).toBe(60);
    });

    it("replace overwrites an expired lease and reports it wrote", async () => {
        await store.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() - 1_000),
        });
        const wrote = await store.replace({
            leaseId: "lse_2",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 100,
            expiresAt: new Date(Date.now() + 60_000),
        });
        expect(wrote).toBe(true);
        expect(store.get("co_1", "ct_1")?.leaseId).toBe("lse_2");
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(100);
    });
});
