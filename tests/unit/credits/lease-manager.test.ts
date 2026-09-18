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
    const logger = makeLogger();
    const manager = new CreditLeaseManager({
        // biome-ignore lint/suspicious/noExplicitAny: stubbed client
        creditsClient: creditsClient as any,
        leaseStore: store,
        logger,
        config: {
            defaultLeaseDuration: 5 * 60_000,
            defaultReservationTTL: 60_000,
            defaultLeaseSize: 1000,
            lowWaterMark: 0.25,
        },
    });
    return { manager, store, logger };
}

// A wire response for `lse_1` reporting the server's new authoritative total.
function extendResponse(grantedAmount: number) {
    return {
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
    };
}

function seedLease(store: LeaseStore, grantedAmount: number) {
    return store.replace({
        leaseId: "lse_1",
        companyId: "co_1",
        creditTypeId: "ct_1",
        grantedAmount,
        expiresAt: new Date(Date.now() + 5 * 60_000),
    });
}

// Drain the microtask queue so a just-started extend has registered its
// in-flight entry (or a joiner has reached the join) before we act.
function flush() {
    return new Promise((r) => setImmediate(r));
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

    it("sends nothing for a trigger that read the lease before the previous extend landed", async () => {
        const creditsClient = {
            extendCreditLease: jest.fn().mockResolvedValue(extendResponse(2000)),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        await seedLease(store, 1000);
        // Spend down to below the 25% water mark.
        await store.tryReserve("co_1", "ct_1", 900);
        const stale = store.get("co_1", "ct_1");

        await manager.maybeExtendInBackground("co_1", "ct_1");
        expect(creditsClient.extendCreditLease).toHaveBeenCalledTimes(1);

        // The second trigger reads the slot as it was before that extend
        // landed: its own flight is gone, so nothing stops it reaching the
        // wire but the re-read the flight registration now makes.
        const live = store.get.bind(store);
        let reads = 0;
        jest.spyOn(store, "get").mockImplementation((companyId, creditTypeId) => {
            reads += 1;
            return reads === 1 ? stale : live(companyId, creditTypeId);
        });

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

    it("a joiner whose shortfall outran the in-flight extend gets its own top-up", async () => {
        // A watermark extend (asking for one tranche) is in flight when a check
        // needing 5000 arrives. Joining it and taking the tranche would leave
        // the check's post-extend retry failing with credits on the server —
        // the joiner has to wait the flight out and top up the difference.
        let releaseExtend!: (v: unknown) => void;
        const extendPending = new Promise((r) => (releaseExtend = r));
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest.fn().mockReturnValueOnce(extendPending).mockResolvedValueOnce(extendResponse(5800)),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        await seedLease(store, 1000);
        await store.tryReserve("co_1", "ct_1", 800); // 200 left → below the 25% watermark

        // The steady-state refresh: asks for the configured tranche, then hangs.
        const watermarkP = manager.maybeExtendInBackground("co_1", "ct_1");
        await flush();
        expect(creditsClient.extendCreditLease).toHaveBeenCalledTimes(1);
        expect(creditsClient.extendCreditLease.mock.calls[0][1].additionalAmount).toBe(1000);

        const joinerP = manager.maybeExtendInBackground("co_1", "ct_1", 5000);
        await flush();
        // Still one wire call: the joiner waits the flight out rather than
        // racing a second extend onto the same lease.
        expect(creditsClient.extendCreditLease).toHaveBeenCalledTimes(1);

        releaseExtend(extendResponse(2000));
        await watermarkP;
        const joined = await joinerP;

        // Exactly one follow-up, sized against the slot the flight just moved:
        // 5000 required − (200 + 1000 granted) = 3800.
        expect(creditsClient.extendCreditLease).toHaveBeenCalledTimes(2);
        expect(creditsClient.extendCreditLease.mock.calls[1][1].additionalAmount).toBe(3800);
        expect(joined?.localRemainingCredits).toBe(5000);
        expect(store.get("co_1", "ct_1")?.localRemainingCredits).toBeGreaterThanOrEqual(5000);
    });

    it("a joiner the in-flight extend already covers still shares the one wire call", async () => {
        // The common case, and the fan-out the follow-up must not introduce:
        // both shortfalls fit inside the tranche the flight already asked for.
        let releaseExtend!: (v: unknown) => void;
        const extendPending = new Promise((r) => (releaseExtend = r));
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest.fn().mockReturnValue(extendPending),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        await seedLease(store, 1000);
        await store.tryReserve("co_1", "ct_1", 800); // 200 left

        const watermarkP = manager.maybeExtendInBackground("co_1", "ct_1");
        await flush();
        // Needs 900 against 200 remaining: a 700 shortfall, inside the tranche.
        const joinerP = manager.maybeExtendInBackground("co_1", "ct_1", 900);
        await flush();

        releaseExtend(extendResponse(2000));
        const [first, joined] = await Promise.all([watermarkP, joinerP]);

        expect(creditsClient.extendCreditLease).toHaveBeenCalledTimes(1);
        expect(joined).toEqual(first);
        expect(joined?.localRemainingCredits).toBe(1200);
    });

    it("bounds the follow-up at one extend when the server cannot cover the request", async () => {
        // The follow-up must not chain: a company whose balance simply cannot
        // reach the request would otherwise spin extending forever.
        let releaseExtend!: (v: unknown) => void;
        const extendPending = new Promise((r) => (releaseExtend = r));
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest
                .fn()
                .mockReturnValueOnce(extendPending)
                // The server grants what it has, still far short of the ask.
                .mockResolvedValue(extendResponse(3000)),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        await seedLease(store, 1000);
        await store.tryReserve("co_1", "ct_1", 800); // 200 left

        const watermarkP = manager.maybeExtendInBackground("co_1", "ct_1");
        await flush();
        const joinerP = manager.maybeExtendInBackground("co_1", "ct_1", 50_000);
        await flush();

        releaseExtend(extendResponse(2000));
        await watermarkP;
        const joined = await joinerP;

        expect(creditsClient.extendCreditLease).toHaveBeenCalledTimes(2);
        // Resolves rather than chaining, still short — the caller's reserve
        // fails and the check reports insufficient balance, as it should.
        expect(joined?.localRemainingCredits).toBe(2200);
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

    it("releaseAllLocalLeases gives up on a release that never lands", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn().mockReturnValue(new Promise(() => {})),
        };
        const { manager, store, logger } = makeManager(creditsClient);
        await store.replace({
            leaseId: "lse_live",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 60_000),
        });

        const started = Date.now();
        await manager.releaseAllLocalLeases(50);

        expect(Date.now() - started).toBeLessThan(1_000);
        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("releasing credit leases on close"));
    });

    it("stop() refuses an acquire before it reaches the wire", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);

        manager.stop();

        // A lease acquired now is one the close that called stop() has already
        // drained past, so nothing would be left to release it.
        await expect(manager.acquireIfNeeded("co_1", "ct_1")).resolves.toBeUndefined();
        expect(creditsClient.acquireCreditLease).not.toHaveBeenCalled();
        expect(store.get("co_1", "ct_1")).toBeUndefined();
    });

    it("stop() during the store read refuses the acquire", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);

        // Past the first stopped check, waiting on the store read.
        const acquiring = manager.acquireIfNeeded("co_1", "ct_1");
        manager.stop();
        await manager.drain();

        await expect(acquiring).resolves.toBeUndefined();
        expect(creditsClient.acquireCreditLease).not.toHaveBeenCalled();
        expect(store.get("co_1", "ct_1")).toBeUndefined();
    });

    it("stop() keeps a background extend from starting", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest.fn(),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        await store.replace({
            leaseId: "lse_live",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 5 * 60_000),
        });
        await store.tryReserve("co_1", "ct_1", 900);

        manager.stop();
        await manager.maybeExtendInBackground("co_1", "ct_1");
        await manager.drain();

        expect(creditsClient.extendCreditLease).not.toHaveBeenCalled();
    });

    it("drain waits out an extend that is still on the wire", async () => {
        let releaseExtend!: (v: unknown) => void;
        const extendPending = new Promise((r) => (releaseExtend = r));
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            extendCreditLease: jest.fn().mockReturnValue(extendPending),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store } = makeManager(creditsClient);
        await store.replace({
            leaseId: "lse_live",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 5 * 60_000),
        });
        await store.tryReserve("co_1", "ct_1", 900); // below the watermark

        // Fire and forget, the way check() does.
        void manager.maybeExtendInBackground("co_1", "ct_1");
        manager.stop();

        let drained = false;
        const draining = manager.drain().then(() => {
            drained = true;
        });
        await new Promise((r) => setImmediate(r));
        expect(drained).toBe(false);

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
        await draining;

        expect(drained).toBe(true);
        expect(store.get("co_1", "ct_1")?.grantedAmount).toBe(2000);
    });

    it("drain gives up on work that will not land", async () => {
        const creditsClient = {
            acquireCreditLease: jest.fn(),
            // Never settles: the wire call is wedged.
            extendCreditLease: jest.fn().mockReturnValue(new Promise(() => {})),
            releaseCreditLease: jest.fn(),
        };
        const { manager, store, logger } = makeManager(creditsClient);
        await store.replace({
            leaseId: "lse_live",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 5 * 60_000),
        });
        await store.tryReserve("co_1", "ct_1", 900);
        void manager.maybeExtendInBackground("co_1", "ct_1");
        manager.stop();

        // A shutdown that hangs is worse than a hold the server expires.
        await manager.drain(10);

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("server-side expiry"));
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
