/**
 * The lease implementation documents two bounded leak windows where a process
 * crash between two store operations strands credits:
 *
 *  1. Debit-then-add: a crash between `leaseStore.tryReserve` (the debit) and
 *     `reservationStore.add` leaks the reserved amount — the sweeper cannot
 *     refund a reservation that was never recorded.
 *  2. Consume-then-refund: a crash between claiming the reservation and
 *     refunding the unspent slice to the lease loses that refund.
 *
 * These tests pin the contract those windows rely on: the leak is capped by
 * the reservation size, it never survives the lease (the expiry guard refuses
 * the stale balance and a successor lease restores the full grant), and a
 * retried flow never double-refunds. Crashes are simulated by running the
 * first store op and interrupting the second (a wrapper that throws or never
 * resolves).
 */
import type { CreditsClient } from "../../../src/api/resources/credits/client/Client";
import { type CreditCheckDeps, checkWithLease } from "../../../src/credits/check";
import { CreditLeaseManager } from "../../../src/credits/lease-manager";
import { type ILeaseStore, LeaseStore } from "../../../src/credits/lease-store";
import { RedisLeaseStore } from "../../../src/credits/redis-lease-store";
import { RedisReservationStore } from "../../../src/credits/redis-reservation-store";
import { type IReservationStore, ReservationStore } from "../../../src/credits/reservation-store";
import { consumeReservationAndBuildEvent } from "../../../src/credits/track";
import type { Reservation } from "../../../src/credits/types";
import type { DataStreamClient } from "../../../src/datastream";
import type { Logger } from "../../../src/logger";
import { makeFakeRedis } from "./fake-redis";

interface Stores {
    leases: ILeaseStore;
    reservations: IReservationStore;
}

// `wrapLeases` interposes on the lease store the RESERVATION store refunds
// through (the consume-then-refund window) while the test body keeps reading
// the real store directly.
type MakeStores = (wrapLeases?: (leases: ILeaseStore) => ILeaseStore) => Stores;

const backends: Array<[string, MakeStores]> = [
    [
        "in-memory",
        (wrapLeases) => {
            const leases = new LeaseStore();
            const reservations = new ReservationStore(wrapLeases ? wrapLeases(leases) : leases, 60_000);
            return { leases, reservations };
        },
    ],
    [
        "redis (fake)",
        (wrapLeases) => {
            const client = makeFakeRedis();
            const leases = new RedisLeaseStore({ client });
            const reservations = new RedisReservationStore({
                client,
                leaseStore: wrapLeases ? wrapLeases(leases) : leases,
                sweepIntervalMs: 60_000,
            });
            return { leases, reservations };
        },
    ],
];

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

async function seedLease(leases: ILeaseStore, expiresAt = new Date(Date.now() + 60_000)): Promise<void> {
    await leases.replace({
        leaseId: "lse_1",
        companyId: "co_1",
        creditTypeId: "ct_1",
        grantedAmount: 1000,
        expiresAt,
    });
}

async function balance(leases: ILeaseStore): Promise<number | undefined> {
    return (await leases.get("co_1", "ct_1"))?.localRemainingCredits;
}

// Lease-store wrapper whose `refund` throws while armed — stands in for a
// process death after the reservation claim but before the refund lands.
function refundCrash(target: ILeaseStore): { store: ILeaseStore; disarm: () => void } {
    let armed = true;
    return {
        disarm: () => {
            armed = false;
        },
        store: {
            get: (companyId, creditTypeId) => target.get(companyId, creditTypeId),
            replace: (entry) => target.replace(entry),
            extend: (companyId, creditTypeId, grantedAmount, newExpiresAt, leaseId) =>
                target.extend(companyId, creditTypeId, grantedAmount, newExpiresAt, leaseId),
            drop: (companyId, creditTypeId) => target.drop(companyId, creditTypeId),
            tryReserve: (companyId, creditTypeId, credits) => target.tryReserve(companyId, creditTypeId, credits),
            refund: (companyId, creditTypeId, credits, leaseId) => {
                if (armed) {
                    throw new Error("simulated crash before refund");
                }
                return target.refund(companyId, creditTypeId, credits, leaseId);
            },
        },
    };
}

describe.each(backends)("crash-window leaks — %s stores", (_name, makeStores) => {
    describe("debit-then-add gap", () => {
        it("leaks at most the reserved amount, and the sweeper cannot refund the unrecorded hold", async () => {
            const { leases, reservations } = makeStores();
            await seedLease(leases);

            // The crash: the atomic debit landed, the reservation record never did.
            expect(await leases.tryReserve("co_1", "ct_1", 100)).toEqual({ balance: 900, leaseId: "lse_1" });

            // Bounded: exactly the reserved amount is stranded, nothing more.
            expect(await balance(leases)).toBe(900);
            // Invisible to the reservation table: nothing to sum, and nothing to
            // sweep — even arbitrarily far past any reservation TTL.
            expect(await reservations.reservedCredits("co_1", "ct_1")).toBe(0);
            expect(await reservations.sweepExpired(new Date(Date.now() + 60 * 60_000))).toBe(0);
            expect(await balance(leases)).toBe(900);
            reservations.stop();
        });

        it("is reclaimed at lease expiry: the stale balance is never served and a successor restores the full grant", async () => {
            jest.useFakeTimers();
            try {
                const t0 = new Date("2026-01-01T00:00:00Z").getTime();
                jest.setSystemTime(t0);
                const { leases, reservations } = makeStores();
                await seedLease(leases, new Date(t0 + 60_000));
                expect(await leases.tryReserve("co_1", "ct_1", 100)).toEqual({ balance: 900, leaseId: "lse_1" });

                jest.setSystemTime(t0 + 60_001);
                // Expiry guard: the leaked balance is stale (the server refunds the
                // whole grant at expiry) and must not serve further reserves.
                expect(await leases.tryReserve("co_1", "ct_1", 1)).toBeNull();
                // The next acquire installs a fresh lease at the full grant — the
                // leak does not outlive the lease.
                expect(
                    await leases.replace({
                        leaseId: "lse_2",
                        companyId: "co_1",
                        creditTypeId: "ct_1",
                        grantedAmount: 1000,
                        expiresAt: new Date(t0 + 180_000),
                    }),
                ).toBe(true);
                expect(await balance(leases)).toBe(1000);
                reservations.stop();
            } finally {
                jest.useRealTimers();
            }
        });

        it("a retried check settles independently: its slice refunds exactly once, the leaked slice never", async () => {
            const { leases, reservations } = makeStores();
            await seedLease(leases);
            // The crashed attempt.
            expect(await leases.tryReserve("co_1", "ct_1", 100)).toEqual({ balance: 900, leaseId: "lse_1" });

            // The retry is a fresh check with a fresh reservation id.
            expect(await leases.tryReserve("co_1", "ct_1", 100)).toEqual({ balance: 800, leaseId: "lse_1" });
            await reservations.add(makeReservation({ id: "res_retry" }));

            expect(await reservations.consume("res_retry", 40)).toBe(40);
            // 1000 − 100 (leaked) − 40 (consumed): the retry's unspent 60 came
            // back exactly once; the leaked 100 stayed leaked.
            expect(await balance(leases)).toBe(860);

            // Nothing refunds twice: not a repeat consume, not a sweep.
            expect(await reservations.consume("res_retry", 40)).toBeNull();
            expect(await reservations.sweepExpired(new Date(Date.now() + 60 * 60_000))).toBe(0);
            expect(await balance(leases)).toBe(860);
            reservations.stop();
        });
    });

    describe("consume-then-refund gap", () => {
        it("loses at most the unspent slice; the claim is durable so nothing double-spends", async () => {
            let crash!: ReturnType<typeof refundCrash>;
            const { leases, reservations } = makeStores((target) => {
                crash = refundCrash(target);
                return crash.store;
            });
            await seedLease(leases);
            expect(await leases.tryReserve("co_1", "ct_1", 100)).toEqual({ balance: 900, leaseId: "lse_1" });
            await reservations.add(makeReservation());

            await expect(reservations.consume("res_1", 30)).rejects.toThrow("simulated crash before refund");

            // The claim survived the crash: the reservation is gone everywhere...
            expect(await reservations.get("res_1")).toBeUndefined();
            expect(await reservations.reservedCredits("co_1", "ct_1")).toBe(0);
            // ...and the 70-credit refund is lost — bounded by creditsReserved.
            expect(await balance(leases)).toBe(900);
            reservations.stop();
        });

        it("a retried settle after the crash neither re-claims nor double-refunds", async () => {
            let crash!: ReturnType<typeof refundCrash>;
            const { leases, reservations } = makeStores((target) => {
                crash = refundCrash(target);
                return crash.store;
            });
            await seedLease(leases);
            expect(await leases.tryReserve("co_1", "ct_1", 100)).toEqual({ balance: 900, leaseId: "lse_1" });
            await reservations.add(makeReservation());
            await expect(reservations.consume("res_1", 30)).rejects.toThrow("simulated crash before refund");
            crash.disarm();

            // The retry finds the reservation already claimed: it cannot refund a
            // second time, and the lost slice stays lost until lease expiry.
            expect(await reservations.consume("res_1", 30)).toBeNull();
            expect(await balance(leases)).toBe(900);
            // The sweeper cannot refund a claimed reservation either.
            expect(await reservations.sweepExpired(new Date(Date.now() + 60 * 60_000))).toBe(0);
            expect(await balance(leases)).toBe(900);
            reservations.stop();
        });

        it("is reclaimed at lease expiry like any other leak", async () => {
            jest.useFakeTimers();
            try {
                const t0 = new Date("2026-01-01T00:00:00Z").getTime();
                jest.setSystemTime(t0);
                let crash!: ReturnType<typeof refundCrash>;
                const { leases, reservations } = makeStores((target) => {
                    crash = refundCrash(target);
                    return crash.store;
                });
                await seedLease(leases, new Date(t0 + 60_000));
                expect(await leases.tryReserve("co_1", "ct_1", 100)).toEqual({ balance: 900, leaseId: "lse_1" });
                await reservations.add(makeReservation());
                await expect(reservations.consume("res_1", 30)).rejects.toThrow("simulated crash before refund");

                jest.setSystemTime(t0 + 60_001);
                expect(await leases.tryReserve("co_1", "ct_1", 1)).toBeNull();
                expect(
                    await leases.replace({
                        leaseId: "lse_2",
                        companyId: "co_1",
                        creditTypeId: "ct_1",
                        grantedAmount: 1000,
                        expiresAt: new Date(t0 + 180_000),
                    }),
                ).toBe(true);
                expect(await balance(leases)).toBe(1000);

                // A very late retried settle must not leak the crashed refund into
                // the successor lease.
                crash.disarm();
                expect(await reservations.consume("res_1", 0)).toBeNull();
                expect(await balance(leases)).toBe(1000);
                reservations.stop();
            } finally {
                jest.useRealTimers();
            }
        });
    });
});

describe("crash-window leaks — redis index reconciliation", () => {
    it("a crash right after the claim (before index cleanup and refund) is reconciled by the sweeper without a refund", async () => {
        const base = makeFakeRedis();
        let armed = true;
        const client = {
            ...base,
            eval: async (script: string, options: { keys: string[]; arguments: string[] }) => {
                const result = await base.eval(script, options);
                // The CLAIM script is the only one returning the flat hash array;
                // throwing right after it emulates a process death with the
                // reservation hash deleted but both indexes and the refund pending.
                if (armed && Array.isArray(result) && script.includes("HGETALL")) {
                    armed = false;
                    throw new Error("simulated crash after claim");
                }
                return result;
            },
        } as typeof base;
        const leases = new RedisLeaseStore({ client });
        const reservations = new RedisReservationStore({ client, leaseStore: leases, sweepIntervalMs: 60_000 });
        await seedLease(leases);
        expect(await leases.tryReserve("co_1", "ct_1", 100)).toEqual({ balance: 900, leaseId: "lse_1" });
        await reservations.add(makeReservation({ expiresAt: new Date(Date.now() - 1) }));

        await expect(reservations.consume("res_1", 30)).rejects.toThrow("simulated crash after claim");

        // The orphaned byCredit field still counts the hold...
        expect(await reservations.reservedCredits("co_1", "ct_1")).toBe(100);

        // ...until the sweeper reconciles it. It must NOT refund: without the
        // hash, exactly-once can't be arbitrated across racing sweepers, so the
        // slice waits for lease expiry instead.
        expect(await reservations.sweepExpired()).toBe(0);
        expect(await reservations.reservedCredits("co_1", "ct_1")).toBe(0);
        expect(await reservations.size()).toBe(0);
        expect(await balance(leases)).toBe(900);
        reservations.stop();
    });
});

/**
 * Lease-store wrapper that expires the slot's lease and installs a successor
 * right before delegating the debit — the deterministic form of the window
 * between `acquireIfNeeded` and `tryReserve` (the awaited extend wire call, or
 * a sibling pod's `replace` on a shared backend). The debit is not keyed by
 * lease id, so it lands on the successor.
 */
function swapLeaseOnReserve(target: ILeaseStore, successorId: string): ILeaseStore {
    let swapped = false;
    return {
        get: (companyId, creditTypeId) => target.get(companyId, creditTypeId),
        replace: (entry) => target.replace(entry),
        extend: (companyId, creditTypeId, grantedAmount, newExpiresAt, leaseId) =>
            target.extend(companyId, creditTypeId, grantedAmount, newExpiresAt, leaseId),
        drop: (companyId, creditTypeId) => target.drop(companyId, creditTypeId),
        tryReserve: async (companyId, creditTypeId, credits) => {
            if (!swapped) {
                swapped = true;
                const now = Date.now();
                // Expire the incumbent, then install the successor: `replace`
                // refuses to displace a live lease.
                const incumbent = await target.get(companyId, creditTypeId);
                if (incumbent) {
                    await target.replace({
                        leaseId: incumbent.leaseId,
                        companyId,
                        creditTypeId,
                        grantedAmount: incumbent.grantedAmount,
                        expiresAt: new Date(now - 1),
                    });
                    await target.drop(companyId, creditTypeId);
                }
                await target.replace({
                    leaseId: successorId,
                    companyId,
                    creditTypeId,
                    grantedAmount: 1000,
                    expiresAt: new Date(now + 60_000),
                });
            }
            return target.tryReserve(companyId, creditTypeId, credits);
        },
        refund: (companyId, creditTypeId, credits, leaseId) => target.refund(companyId, creditTypeId, credits, leaseId),
    };
}

/** The real `checkWithLease` flow, wired to whatever lease store is handed in. */
function makeCheckDeps(leaseStore: ILeaseStore, reservations: IReservationStore): CreditCheckDeps {
    const logger: Logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const manager = new CreditLeaseManager({
        // The seeded live lease means acquireIfNeeded never hits the wire.
        creditsClient: {} as unknown as CreditsClient,
        leaseStore,
        logger,
        config: { defaultReservationTTL: 60_000 },
    });
    const engine = {
        checkFlagWithOptions: jest.fn().mockResolvedValue({
            value: true,
            reason: "probe",
            flagKey: "inference",
            flagId: "flag_1",
            entitlement: {
                featureId: "feat",
                featureKey: "inference",
                valueType: "credit",
                creditId: "ct_1",
                consumptionRate: 10,
                eventSubtype: "inference_tokens",
            },
        }),
    };
    const datastream = {
        getFlag: jest.fn().mockResolvedValue({ id: "flag_1", key: "inference" }),
        getCompany: jest.fn().mockResolvedValue({ id: "co_1", creditBalances: { ct_1: 5000 } }),
        getUser: jest.fn(),
        getRulesEngine: () => engine,
    } as unknown as DataStreamClient;
    return { leaseStore, reservations, manager, datastream, logger, enqueueFlagCheckEvent: jest.fn() };
}

describe.each(backends)("checkWithLease lease-swap window — %s stores", (_name, makeStores) => {
    it("pins the reservation to the successor the debit landed on, so its refund applies", async () => {
        const { leases, reservations } = makeStores();
        await seedLease(leases);

        const deps = makeCheckDeps(swapLeaseOnReserve(leases, "lse_2"), reservations);
        const result = await checkWithLease(
            deps,
            "inference",
            { company: { id: "co_1" } },
            { usage: 10, eventSubtype: "inference_tokens" },
            jest.fn(),
        );

        expect(result.allowed).toBe(true);
        // Pinning `acquireIfNeeded`'s lse_1 here would name a lease that was
        // never charged.
        expect(result.reservation?.leaseId).toBe("lse_2");
        expect(await leases.get("co_1", "ct_1")).toMatchObject({ leaseId: "lse_2" });
        expect(await balance(leases)).toBe(900);

        // Cancelling refunds the successor: `refund`'s pin drops a refund aimed
        // at any other lease, so a stale pin would leave the balance at 900.
        expect(await reservations.consume(result.reservation?.id ?? "", 0)).toBe(0);
        expect(await balance(leases)).toBe(1000);
        reservations.stop();
    });

    it("emits the successor's lease_id on the settling Track event", async () => {
        const { leases, reservations } = makeStores();
        await seedLease(leases);

        const deps = makeCheckDeps(swapLeaseOnReserve(leases, "lse_2"), reservations);
        const result = await checkWithLease(
            deps,
            "inference",
            { company: { id: "co_1" } },
            { usage: 10, eventSubtype: "inference_tokens" },
            jest.fn(),
        );
        const reservation = result.reservation;
        if (!reservation) throw new Error("expected a reservation");

        const { track, settledLocally } = await consumeReservationAndBuildEvent(reservations, reservation, 4);

        expect(settledLocally).toBe(true);
        // A stale pin would bill lse_2's spend against the released lse_1, and
        // the server would fall through to the grants.
        expect(track.leaseId).toBe("lse_2");
        // 1000 − 100 reserved + 60 unspent refunded to lse_2.
        expect(await balance(leases)).toBe(960);
        reservations.stop();
    });
});

describe.each(backends)("checkWithLease crash window — %s stores", (_name, makeStores) => {
    it("debits the lease before recording the reservation: a crash in the gap leaks the debit but never double-spends", async () => {
        const { leases, reservations } = makeStores();
        await seedLease(leases);

        let reservationPassedToAdd: Reservation | undefined;
        let reachedAdd!: () => void;
        const addReached = new Promise<void>((resolve) => {
            reachedAdd = resolve;
        });
        // Freeze the real check flow at the crash point: `add` is reached but
        // never completes, so neither the persist nor the undo-on-failure path
        // runs — exactly what a process death in the gap leaves behind.
        const interrupted: IReservationStore = {
            add: (reservation) => {
                reservationPassedToAdd = reservation;
                reachedAdd();
                return new Promise<never>(() => {});
            },
            get: (id) => reservations.get(id),
            consume: (id, credits) => reservations.consume(id, credits),
            reservedCredits: (companyId, creditTypeId) => reservations.reservedCredits(companyId, creditTypeId),
            startSweep: () => reservations.startSweep(),
            sweepExpired: (now) => reservations.sweepExpired(now),
            stop: () => reservations.stop(),
            size: () => reservations.size(),
        };

        const logger: Logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
        const manager = new CreditLeaseManager({
            // The seeded live lease means acquireIfNeeded never hits the wire.
            creditsClient: {} as unknown as CreditsClient,
            leaseStore: leases,
            logger,
            config: { defaultReservationTTL: 60_000 },
        });
        const engine = {
            checkFlagWithOptions: jest.fn().mockResolvedValue({
                value: true,
                reason: "probe",
                flagKey: "inference",
                flagId: "flag_1",
                entitlement: {
                    featureId: "feat",
                    featureKey: "inference",
                    valueType: "credit",
                    creditId: "ct_1",
                    consumptionRate: 10,
                    eventSubtype: "inference_tokens",
                },
            }),
        };
        const datastream = {
            getFlag: jest.fn().mockResolvedValue({ id: "flag_1", key: "inference" }),
            getCompany: jest.fn().mockResolvedValue({ id: "co_1", creditBalances: { ct_1: 5000 } }),
            getUser: jest.fn(),
            getRulesEngine: () => engine,
        } as unknown as DataStreamClient;
        const deps: CreditCheckDeps = {
            leaseStore: leases,
            reservations: interrupted,
            manager,
            datastream,
            logger,
            enqueueFlagCheckEvent: jest.fn(),
        };
        const fallback = jest.fn();

        // Never resolves (the flow is frozen inside `add`) — deliberately not awaited.
        void checkWithLease(
            deps,
            "inference",
            { company: { id: "co_1" } },
            { usage: 10, eventSubtype: "inference_tokens" },
            fallback,
        );
        await addReached;

        // At the crash point the debit is already durable...
        expect(await balance(leases)).toBe(900);
        // ...but no reservation record exists anywhere the sweeper could refund.
        // This pins the documented ordering: a crash here leaks the debit
        // (bounded, reclaimed at lease expiry) rather than leaving a record
        // without a debit, which a later consume would turn into a double-spend.
        expect(await reservations.reservedCredits("co_1", "ct_1")).toBe(0);
        expect(await reservations.size()).toBe(0);
        // The leak bound is the reservation's own size.
        expect(reservationPassedToAdd?.creditsReserved).toBe(100);
        expect(fallback).not.toHaveBeenCalled();
        reservations.stop();
    });
});
