import { CreditLeaseManager } from "../../../src/credits/lease-manager";
import { LeaseStore } from "../../../src/credits/lease-store";
import { RedisLeaseStore } from "../../../src/credits/redis-lease-store";
import type { ILeaseStore } from "../../../src/credits/lease-store";
import type { Logger } from "../../../src/logger";
import { makeFakeRedis } from "./fake-redis";

function makeLogger(): Logger {
    return {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}

function makeManager(creditsClient: { [k: string]: jest.Mock }) {
    const store = new LeaseStore();
    const manager = new CreditLeaseManager({
        // biome-ignore lint/suspicious/noExplicitAny: stubbed client
        creditsClient: creditsClient as any,
        leaseStore: store,
        logger: makeLogger(),
        config: {
            defaultLeaseDuration: 5 * 60_000,
            defaultReservationTTL: 60_000,
            defaultLeaseSize: 1000,
            lowWaterMark: 0.25,
        },
    });
    return { manager, store };
}

describe("CreditLeaseManager", () => {
    it("acquireIfNeeded calls acquireCreditLease and installs the lease", async () => {
        const expiresAt = new Date(Date.now() + 5 * 60_000);
        const creditsClient = {
            acquireCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 1000,
                    expiresAt,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);

        const entry = await manager.acquireIfNeeded("co_1", "ct_1");
        expect(creditsClient.acquireCreditLease).toHaveBeenCalledTimes(1);
        expect(entry?.leaseId).toBe("lse_1");
        expect(entry?.grantedAmount).toBe(1000);
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(1000);
    });

    it("acquireIfNeeded is single-flight for concurrent callers", async () => {
        let resolve!: (v: unknown) => void;
        const pending = new Promise((r) => (resolve = r));
        const creditsClient = {
            acquireCreditLease: jest.fn().mockReturnValue(pending),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn(),
        };
        const { manager } = makeManager(creditsClient);

        const p1 = manager.acquireIfNeeded("co_1", "ct_1");
        const p2 = manager.acquireIfNeeded("co_1", "ct_1");
        const p3 = manager.acquireIfNeeded("co_1", "ct_1");

        resolve({
            data: {
                id: "lse_1",
                companyId: "co_1",
                creditTypeId: "ct_1",
                grantedAmount: 1000,
                expiresAt: new Date(Date.now() + 5 * 60_000),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            params: {},
        });

        await Promise.all([p1, p2, p3]);
        expect(creditsClient.acquireCreditLease).toHaveBeenCalledTimes(1);
    });

    it("acquireIfNeeded reuses a live lease (no second wire call)", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 1000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn(),
        };
        const { manager } = makeManager(creditsClient);
        await manager.acquireIfNeeded("co_1", "ct_1");
        await manager.acquireIfNeeded("co_1", "ct_1");
        expect(creditsClient.acquireCreditLease).toHaveBeenCalledTimes(1);
    });

    it("acquireIfNeeded re-acquires over an expired slot, replacing it in place", async () => {
        // No explicit drop happens inside acquireIfNeeded — `replace` overwrites
        // the expired entry atomically. Seed an already-expired lease and verify
        // the fresh one supplants it without a redundant-release call.
        const creditsClient = {
            acquireCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_fresh",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 1000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        // Seed an already-expired lease in the slot.
        await store.replace({
            leaseId: "lse_stale",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() - 1),
        });

        const entry = await manager.acquireIfNeeded("co_1", "ct_1");
        expect(creditsClient.acquireCreditLease).toHaveBeenCalledTimes(1);
        // Fresh lease supplants the stale one in place, full balance restored.
        expect(entry?.leaseId).toBe("lse_fresh");
        expect(entry?.localRemainingCredits).toBe(1000);
        expect(store.get("co_1", "ct_1")?.leaseId).toBe("lse_fresh");
        // The redundant-lease release path must NOT fire: the slot was expired,
        // so `replace` wrote (returned true) rather than keeping a live lease.
        expect(creditsClient.releaseCreditLease).not.toHaveBeenCalled();
    });

    it("maybeExtendInBackground triggers extend when below low water mark", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 1000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            extendCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 2000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        await manager.acquireIfNeeded("co_1", "ct_1");
        // Spend down to below 25%
        await store.tryReserve("co_1", "ct_1", 800);
        await manager.maybeExtendInBackground("co_1", "ct_1");
        expect(creditsClient.extendCreditLease).toHaveBeenCalledTimes(1);
        expect(store.get("co_1", "ct_1")?.grantedAmount).toBe(2000);
    });

    it("maybeExtendInBackground extends when requiredCredits exceeds local remaining even above watermark", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 1000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            extendCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 2000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        await manager.acquireIfNeeded("co_1", "ct_1");
        // Spend a little — still well above the 25% watermark (900/1000 = 90%).
        await store.tryReserve("co_1", "ct_1", 100);
        // Without the hint, this would no-op (ratio > watermark).
        await manager.maybeExtendInBackground("co_1", "ct_1");
        expect(creditsClient.extendCreditLease).not.toHaveBeenCalled();
        // Caller asks for 1500 credits worth — we only have 900 local, so extend.
        await manager.maybeExtendInBackground("co_1", "ct_1", 1500);
        expect(creditsClient.extendCreditLease).toHaveBeenCalledTimes(1);
        expect(store.get("co_1", "ct_1")?.grantedAmount).toBe(2000);
    });

    it("sizes the extend to cover a request larger than the configured tranche", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 1000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            extendCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 5100,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        await manager.acquireIfNeeded("co_1", "ct_1");
        await store.tryReserve("co_1", "ct_1", 100); // 900 remaining
        // A single check needing 5000 credits: the shortfall (4100) exceeds the
        // configured tranche (1000), so the extend must request the shortfall —
        // a tranche-sized extend would leave the post-extend retry failing
        // forever regardless of server balance.
        await manager.maybeExtendInBackground("co_1", "ct_1", 5000);
        expect(creditsClient.extendCreditLease).toHaveBeenCalledTimes(1);
        const body = creditsClient.extendCreditLease.mock.calls[0][1];
        expect(body.additionalAmount).toBe(4100);
        // Local mirror reflects the server's new totals: 900 + 4100 = 5000.
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBe(5000);
    });

    it("maybeExtendInBackground refuses to extend an expired lease", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        // Expired lease, balance well below the watermark.
        await store.replace({
            leaseId: "lse_old",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() - 1_000),
        });
        const entry = await manager.maybeExtendInBackground("co_1", "ct_1", 1500);
        expect(entry).toBeUndefined();
        // The server treats an expired lease as released — the right move is a
        // fresh acquire (next check's acquireIfNeeded), never an extend.
        expect(creditsClient.extendCreditLease).not.toHaveBeenCalled();
    });

    it("acquireIfNeeded and maybeExtendInBackground report undefined instead of rejecting on store failures", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn(),
        };
        const brokenStore = {
            get: jest.fn().mockRejectedValue(new Error("redis down")),
            replace: jest.fn(),
            extend: jest.fn(),
            drop: jest.fn(),
            tryReserve: jest.fn(),
            refund: jest.fn(),
        } as unknown as ILeaseStore;
        const manager = new CreditLeaseManager({
            // biome-ignore lint/suspicious/noExplicitAny: stubbed client
            creditsClient: creditsClient as any,
            leaseStore: brokenStore,
            logger: makeLogger(),
            config: {},
        });
        await expect(manager.acquireIfNeeded("co_1", "ct_1")).resolves.toBeUndefined();
        // Often called fire-and-forget — a rejection would be unhandled.
        await expect(manager.maybeExtendInBackground("co_1", "ct_1")).resolves.toBeUndefined();
        expect(creditsClient.acquireCreditLease).not.toHaveBeenCalled();
        expect(creditsClient.extendCreditLease).not.toHaveBeenCalled();
    });

    it("threads requestOptions to acquire and extend wire calls", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 1000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            extendCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 2000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        const requestOptions = { timeoutInSeconds: 2 };
        await manager.acquireIfNeeded("co_1", "ct_1", requestOptions);
        expect(creditsClient.acquireCreditLease).toHaveBeenCalledWith(
            expect.objectContaining({ companyId: "co_1" }),
            requestOptions,
        );
        await store.tryReserve("co_1", "ct_1", 800);
        await manager.maybeExtendInBackground("co_1", "ct_1", undefined, requestOptions);
        expect(creditsClient.extendCreditLease).toHaveBeenCalledWith("lse_1", expect.anything(), requestOptions);
    });

    it("releaseAllLocalLeases releases live leases and skips expired ones", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn().mockResolvedValue({}),
        };
        const { manager, store } = makeManager(creditsClient);
        await store.replace({
            leaseId: "lse_live",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });
        await store.replace({
            leaseId: "lse_expired",
            companyId: "co_2",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() - 1_000),
        });
        await manager.releaseAllLocalLeases();
        expect(creditsClient.releaseCreditLease).toHaveBeenCalledTimes(1);
        expect(creditsClient.releaseCreditLease).toHaveBeenCalledWith("lse_live", {});
        // Released lease is dropped locally; the expired one is left for lazy expiry.
        expect(store.get("co_1", "ct_1")).toBeUndefined();
    });

    it("does not conflate concurrent acquire and extend on the same key", async () => {
        // Pre-install a live lease with a sub-watermark balance so an extend
        // is warranted. We then hold the extend mid-flight and fire an
        // acquireIfNeeded against an *expired* slot for a different lease id —
        // the two operations must not share inflight state.
        let releaseExtend!: (v: unknown) => void;
        const extendPending = new Promise((r) => (releaseExtend = r));
        const creditsClient = {
            acquireCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_fresh",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 1000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            extendCreditLease: jest.fn().mockReturnValue(extendPending),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        // Seed a live, debited lease so `maybeExtendInBackground` triggers an extend.
        await store.replace({
            leaseId: "lse_live",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 5 * 60_000),
        });
        await store.tryReserve("co_1", "ct_1", 800); // 200 left → below 25% watermark

        // Kick off the extend (will hang on extendPending).
        const extendP = manager.maybeExtendInBackground("co_1", "ct_1");

        // Drop the lease so acquire is needed, then call acquireIfNeeded —
        // this must NOT receive the in-flight extend promise.
        await store.drop("co_1", "ct_1");
        const acquired = await manager.acquireIfNeeded("co_1", "ct_1");
        expect(acquired?.leaseId).toBe("lse_fresh");
        expect(creditsClient.acquireCreditLease).toHaveBeenCalledTimes(1);

        // Let the extend resolve so we don't leak the pending promise.
        releaseExtend({
            data: {
                id: "lse_live",
                companyId: "co_1",
                creditTypeId: "ct_1",
                grantedAmount: 2000,
                expiresAt: new Date(Date.now() + 5 * 60_000),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            params: {},
        });
        await extendP;
    });

    it("releases the redundant lease when it loses a concurrent cross-pod acquire race", async () => {
        // Two managers share one backing store (mirrors two pods on one Redis).
        // Both see an empty slot and acquire from the API in parallel; only one
        // lease can win the slot, and the loser must release the lease it minted
        // so it isn't left as an orphaned hold against the company balance.
        const sharedStore: ILeaseStore = new RedisLeaseStore({ client: makeFakeRedis() });
        const config = {
            defaultLeaseDuration: 5 * 60_000,
            defaultReservationTTL: 60_000,
            defaultLeaseSize: 1000,
            lowWaterMark: 0.25,
        };
        const mkManager = (leaseId: string) => {
            const creditsClient = {
                acquireCreditLease: jest.fn().mockResolvedValue({
                    data: {
                        id: leaseId,
                        companyId: "co_1",
                        creditTypeId: "ct_1",
                        grantedAmount: 1000,
                        expiresAt: new Date(Date.now() + 5 * 60_000),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    params: {},
                }),
                extendCreditLease: jest.fn(),
                releaseCreditLease: jest.fn().mockResolvedValue({ data: {}, params: {} }),
            };
            const manager = new CreditLeaseManager({
                // biome-ignore lint/suspicious/noExplicitAny: stubbed client
                creditsClient: creditsClient as any,
                leaseStore: sharedStore,
                logger: makeLogger(),
                config,
            });
            return { manager, creditsClient };
        };
        const a = mkManager("lse_a");
        const b = mkManager("lse_b");

        const [ea, eb] = await Promise.all([
            a.manager.acquireIfNeeded("co_1", "ct_1"),
            b.manager.acquireIfNeeded("co_1", "ct_1"),
        ]);

        // Both raced to the API.
        expect(a.creditsClient.acquireCreditLease).toHaveBeenCalledTimes(1);
        expect(b.creditsClient.acquireCreditLease).toHaveBeenCalledTimes(1);

        // Exactly one lease survives in the shared slot, and both managers see it.
        const survivor = await sharedStore.get("co_1", "ct_1");
        expect(survivor).toBeDefined();
        expect(["lse_a", "lse_b"]).toContain(survivor!.leaseId);
        expect(ea?.leaseId).toBe(survivor!.leaseId);
        expect(eb?.leaseId).toBe(survivor!.leaseId);

        // The loser released its redundant lease exactly once, across both.
        const releaseCalls =
            a.creditsClient.releaseCreditLease.mock.calls.length + b.creditsClient.releaseCreditLease.mock.calls.length;
        expect(releaseCalls).toBe(1);
        const loserId = survivor!.leaseId === "lse_a" ? "lse_b" : "lse_a";
        const loser = survivor!.leaseId === "lse_a" ? b : a;
        expect(loser.creditsClient.releaseCreditLease).toHaveBeenCalledWith(loserId, {});
    });

    it("does NOT release when a lost acquire race was handed the installed lease (idempotent server)", async () => {
        // The server is idempotent for an active (company, creditType) slot:
        // a racing acquire is handed back the SAME lease the sibling installed
        // (`reused_active`). The loser's `replace` returns false, but there is
        // nothing to release — releasing would mark the shared lease released
        // server-side and refund its remainder while every pod keeps reserving
        // against it locally.
        const sharedStore: ILeaseStore = new RedisLeaseStore({ client: makeFakeRedis() });
        const config = {
            defaultLeaseDuration: 5 * 60_000,
            defaultReservationTTL: 60_000,
            defaultLeaseSize: 1000,
            lowWaterMark: 0.25,
        };
        // Both managers' acquires resolve to the same server lease.
        const mkManager = () => {
            const creditsClient = {
                acquireCreditLease: jest.fn().mockResolvedValue({
                    data: {
                        id: "lse_shared",
                        companyId: "co_1",
                        creditTypeId: "ct_1",
                        grantedAmount: 1000,
                        expiresAt: new Date(Date.now() + 5 * 60_000),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                    params: {},
                }),
                extendCreditLease: jest.fn(),
                releaseCreditLease: jest.fn().mockResolvedValue({ data: {}, params: {} }),
            };
            const manager = new CreditLeaseManager({
                // biome-ignore lint/suspicious/noExplicitAny: stubbed client
                creditsClient: creditsClient as any,
                leaseStore: sharedStore,
                logger: makeLogger(),
                config,
            });
            return { manager, creditsClient };
        };
        const a = mkManager();
        const b = mkManager();

        const [ea, eb] = await Promise.all([
            a.manager.acquireIfNeeded("co_1", "ct_1"),
            b.manager.acquireIfNeeded("co_1", "ct_1"),
        ]);

        // Both raced to the API and both came back holding the shared lease.
        expect(ea?.leaseId).toBe("lse_shared");
        expect(eb?.leaseId).toBe("lse_shared");
        const survivor = await sharedStore.get("co_1", "ct_1");
        expect(survivor?.leaseId).toBe("lse_shared");

        // Neither manager released — the "redundant" lease IS the shared lease.
        expect(a.creditsClient.releaseCreditLease).not.toHaveBeenCalled();
        expect(b.creditsClient.releaseCreditLease).not.toHaveBeenCalled();
    });

    it("concurrent cross-pod extends reconcile to the server total instead of double-counting", async () => {
        // Two managers share one backing store (mirrors two pods on one Redis).
        // Per-process single-flight can't serialize their extends, so both
        // wire calls go out against the same stale local read (granted=1000).
        // The server applies them serially — totals 2000 then 3000 — and each
        // pod reconciles to the TOTAL the server returned. With the old
        // delta-apply, each pod would add its own stale-read delta
        // (1000 + 2000) and mint 1000 phantom credits into the shared balance.
        const sharedStore: ILeaseStore = new RedisLeaseStore({ client: makeFakeRedis() });
        const config = {
            defaultLeaseDuration: 5 * 60_000,
            defaultReservationTTL: 60_000,
            defaultLeaseSize: 1000,
            lowWaterMark: 0.25,
        };
        const wireResponse = (grantedAmount: number) => ({
            data: {
                id: "lse_1",
                companyId: "co_1",
                creditTypeId: "ct_1",
                grantedAmount,
                expiresAt: new Date(Date.now() + 5 * 60_000),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            params: {},
        });
        const mkPod = (pendingExtend: Promise<unknown>) => {
            const creditsClient = {
                acquireCreditLease: jest.fn(),
                extendCreditLease: jest.fn().mockReturnValue(pendingExtend),
                releaseCreditLease: jest.fn(),
            };
            const manager = new CreditLeaseManager({
                // biome-ignore lint/suspicious/noExplicitAny: stubbed client
                creditsClient: creditsClient as any,
                leaseStore: sharedStore,
                logger: makeLogger(),
                config,
            });
            return { manager, creditsClient };
        };
        let resolveA!: (v: unknown) => void;
        let resolveB!: (v: unknown) => void;
        const podA = mkPod(new Promise((r) => (resolveA = r)));
        const podB = mkPod(new Promise((r) => (resolveB = r)));

        await sharedStore.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 5 * 60_000),
        });
        // Spend down below the 25% watermark so both pods extend.
        await sharedStore.tryReserve("co_1", "ct_1", 800);

        // Both extends are issued before either wire call resolves, so both
        // managers read the same stale granted=1000.
        const extendA = podA.manager.maybeExtendInBackground("co_1", "ct_1");
        const extendB = podB.manager.maybeExtendInBackground("co_1", "ct_1");
        // Server lands B's extend first (total 2000), then A's (total 3000).
        resolveB(wireResponse(2000));
        resolveA(wireResponse(3000));
        await Promise.all([extendA, extendB]);

        expect(podA.creditsClient.extendCreditLease).toHaveBeenCalledTimes(1);
        expect(podB.creditsClient.extendCreditLease).toHaveBeenCalledTimes(1);
        const entry = await sharedStore.get("co_1", "ct_1");
        // Authoritative totals: granted 3000; remaining 200 + 2000 = 2200.
        expect(entry?.grantedAmount).toBe(3000);
        expect(entry?.localRemainingCredits).toBe(2200);
    });

    it("does not release the lease on a normal uncontended acquire", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn().mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "co_1",
                    creditTypeId: "ct_1",
                    grantedAmount: 1000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                params: {},
            }),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn().mockResolvedValue({ data: {}, params: {} }),
        };
        const { manager } = makeManager(creditsClient);
        await manager.acquireIfNeeded("co_1", "ct_1");
        expect(creditsClient.releaseCreditLease).not.toHaveBeenCalled();
    });
});
