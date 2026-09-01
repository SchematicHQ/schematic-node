/**
 * Seeded concurrency race tests for the lease/reservation stores (and the
 * lease manager on top of them). Each scenario targets one of the race pairs
 * the conformance spec can only state as prose invariants:
 *
 * - concurrent acquires (replace) on one slot: keep-first, single live lease
 * - extend racing lease expiry and successor installs: pinned extends never
 *   credit a successor; expiry only moves forward
 * - settle (consume) racing the sweeper: exactly-once claims, no double or
 *   lost refunds
 * - successor replace racing try_reserve: expired balances are never served
 * - manager acquire/extend single-flight over a shared store: the installed
 *   lease is never released out from under siblings; extends never mint
 *   phantom credits
 * - mixed chaos across slots: all of the above at once, plus drops and
 *   simulated window-1 crashes (bounded leak)
 *
 * Every run is deterministic per seed. A failure prints the seed; replay it
 * with `RACE_SEED=<seed> yarn test tests/races`. `RACE_ITERATIONS=<n>` scales
 * the batch (default 40 per scenario/backend).
 */
import { CreditLeaseManager } from "../../src/credits/lease-manager";
import type { Logger } from "../../src/logger";

import type { RaceCtx, RaceScenario, Slot, WeightedOp } from "./harness";
import {
    advanceOp,
    backends,
    consumeOp,
    dropOp,
    expiredProbeOp,
    extendObservedOp,
    invalidReserveOp,
    quarters,
    replaceFreshOp,
    reserveOp,
    runScenario,
    seedBatch,
    slotKeyOf,
    sweepOp,
    verifyInvariants,
} from "./harness";
import { deriveSeed, Rng } from "./prng";
import { ScriptedCreditsServer } from "./scripted-server";

const seeds = seedBatch(40);

jest.setTimeout(600_000);

const oneSlot: Slot[] = [{ companyId: "co_1", creditTypeId: "ct_1" }];
const twoSlots: Slot[] = [
    { companyId: "co_1", creditTypeId: "ct_1" },
    { companyId: "co_1", creditTypeId: "ct_2" },
];

const silentLogger: Logger = { error() {}, warn() {}, info() {}, debug() {} };

async function installLease(ctx: RaceCtx, slot: Slot, granted: number, expiresAtMs: number): Promise<string> {
    const leaseId = ctx.nextId("lse");
    const wrote = await ctx.leases.replace({
        leaseId,
        companyId: slot.companyId,
        creditTypeId: slot.creditTypeId,
        grantedAmount: granted,
        expiresAt: new Date(expiresAtMs),
    });
    if (!wrote) throw new Error(`setup: failed to install lease for ${slotKeyOf(slot)}`);
    ctx.model.installs.set(leaseId, { slotKey: slotKeyOf(slot), granted, expiresAtMs });
    return leaseId;
}

const scenarios: RaceScenario[] = [
    {
        // Documented gap: single-flight / concurrent acquires. All installs
        // use a lease that can never expire, so exactly one concurrent
        // `replace` may win the slot; the losers must keep the winner's
        // already-debited balance intact (conservation stays exact).
        name: "concurrent acquires (replace) on one slot",
        slots: oneSlot,
        async build(ctx) {
            return {
                ops: [
                    replaceFreshOp(ctx, { durationMs: "immortal", grantedQuarters: [2000, 4000], weight: 3 }),
                    reserveOp(ctx, { ttlMs: [100, 800], maxQuarters: 100 }),
                    consumeOp(ctx),
                    sweepOp(ctx),
                    advanceOp(ctx),
                    invalidReserveOp(ctx),
                ],
                verify: async () => {
                    const violations = await verifyInvariants(ctx, { conservation: true, exactLeaseState: true });
                    if (ctx.model.installs.size > 1) {
                        violations.push(
                            `${ctx.model.installs.size} concurrent replaces reported written=true for one live slot`,
                        );
                    }
                    return violations;
                },
            };
        },
    },
    {
        // Documented gap: extend racing expiry. A short-lived lease is
        // extended (pinned) while the clock races past its expiry and
        // successors install over it. A pinned extend must never credit a
        // successor, and a lease's final granted/expiry must equal exactly
        // what its install plus its own pinned extends produced.
        name: "extend racing expiry and successor installs",
        slots: oneSlot,
        async build(ctx) {
            const setupRng = new Rng(deriveSeed(ctx.seed, 101));
            await installLease(
                ctx,
                ctx.slots[0],
                quarters(setupRng, 2000, 800),
                ctx.clock.now() + setupRng.intBetween(300, 1200),
            );
            return {
                ops: [
                    advanceOp(ctx, 3),
                    extendObservedOp(ctx, [300, 1500]),
                    replaceFreshOp(ctx, { durationMs: [300, 1500], grantedQuarters: [800, 2000], onlyIfDead: true }),
                    reserveOp(ctx, { ttlMs: [100, 700], maxQuarters: 60 }),
                    consumeOp(ctx),
                    sweepOp(ctx),
                    expiredProbeOp(ctx),
                ],
                verify: () => verifyInvariants(ctx, { exactLeaseState: true }),
            };
        },
    },
    {
        // Documented gap: release (settle) racing the sweeper. One immortal
        // lease; short-TTL reservations are settled by racing consumers while
        // sweeps and clock advances fire concurrently, with occasional
        // simulated window-1 crashes (debit without record). Conservation is
        // exact: every credit is remaining, held, consumed, or accounted to
        // the crash-leak budget — a double refund (sweeper + settle both
        // winning a claim) or a lost refund breaks the equality.
        name: "settle (consume) racing the sweeper",
        slots: oneSlot,
        async build(ctx) {
            const setupRng = new Rng(deriveSeed(ctx.seed, 202));
            await installLease(
                ctx,
                ctx.slots[0],
                quarters(setupRng, 1600, 1000),
                ctx.clock.now() + 10 * 365 * 24 * 60 * 60 * 1000,
            );
            return {
                ops: [
                    reserveOp(ctx, { ttlMs: [100, 700], maxQuarters: 400, crashChance: 0.1 }),
                    { ...consumeOp(ctx), weight: 4 },
                    { ...sweepOp(ctx), weight: 3 },
                    advanceOp(ctx, 3),
                    extendObservedOp(ctx, [300, 1500]),
                    invalidReserveOp(ctx),
                ],
                verify: () => verifyInvariants(ctx, { conservation: true, exactLeaseState: true, requireLease: true }),
            };
        },
    },
    {
        // Documented gap: replace racing try_reserve. Leases churn quickly
        // (short durations, aggressive clock advances) while reserves are in
        // flight, so debits race successor installs. A reserve must never be
        // served by an expired balance and never mint credits on a successor.
        name: "successor replace racing try_reserve",
        slots: oneSlot,
        async build(ctx) {
            const setupRng = new Rng(deriveSeed(ctx.seed, 303));
            await installLease(
                ctx,
                ctx.slots[0],
                quarters(setupRng, 1200, 400),
                ctx.clock.now() + setupRng.intBetween(200, 1000),
            );
            return {
                ops: [
                    replaceFreshOp(ctx, {
                        durationMs: [200, 1000],
                        grantedQuarters: [400, 1200],
                        onlyIfDead: true,
                        weight: 3,
                    }),
                    { ...reserveOp(ctx, { ttlMs: [100, 600], maxQuarters: 40 }), weight: 5 },
                    consumeOp(ctx),
                    { ...sweepOp(ctx), weight: 1 },
                    advanceOp(ctx, 3),
                    expiredProbeOp(ctx),
                ],
                verify: () => verifyInvariants(ctx, { exactLeaseState: true }),
            };
        },
    },
    {
        // Everything at once, across two slots: acquires, pinned extends,
        // reserves, settles, sweeps, drops, clock advances, and window-1
        // crashes, all interleaved by seed.
        name: "mixed chaos across slots",
        slots: twoSlots,
        async build(ctx) {
            return {
                ops: [
                    replaceFreshOp(ctx, { durationMs: [200, 1200], grantedQuarters: [400, 1600], weight: 3 }),
                    extendObservedOp(ctx, [300, 1500]),
                    reserveOp(ctx, { ttlMs: [100, 700], maxQuarters: 60, crashChance: 0.1 }),
                    consumeOp(ctx),
                    sweepOp(ctx),
                    advanceOp(ctx, 3),
                    dropOp(ctx),
                    invalidReserveOp(ctx),
                    expiredProbeOp(ctx, 1),
                ],
                verify: () => verifyInvariants(ctx, { exactLeaseState: true }),
            };
        },
    },
    {
        // Documented gap: per-slot single-flight and the redundant-release
        // rules, driven through the real CreditLeaseManager. Two managers
        // ("pods") share one store and one scripted wire server whose calls
        // carry seeded latency, so acquire responses race sibling installs
        // and extend responses race expiry. The lease actually installed must
        // never be released server-side, and the local view must never exceed
        // the server-authoritative total.
        name: "manager acquire/extend single-flight over a shared store",
        slots: oneSlot,
        async build(ctx) {
            const buildRng = new Rng(deriveSeed(ctx.seed, 404));
            const server = new ScriptedCreditsServer(ctx.clock, new Rng(deriveSeed(ctx.seed, 405)));
            const leaseDuration = buildRng.intBetween(800, 2500);
            const managers = [0, 1].map(
                () =>
                    new CreditLeaseManager({
                        creditsClient: server.client(),
                        leaseStore: ctx.leases,
                        logger: silentLogger,
                        config: {
                            defaultLeaseDuration: leaseDuration,
                            defaultReservationTTL: 60_000,
                            defaultLeaseSize: 500,
                            lowWaterMark: 0.25,
                        },
                    }),
            );
            const slot = ctx.slots[0];
            const ops: WeightedOp[] = [
                {
                    weight: 4,
                    run: async (rng) => {
                        await managers[rng.int(managers.length)].acquireIfNeeded(slot.companyId, slot.creditTypeId);
                    },
                },
                {
                    weight: 3,
                    run: async (rng) => {
                        const required = rng.chance(0.5) ? quarters(rng, 2400) : undefined;
                        await managers[rng.int(managers.length)].maybeExtendInBackground(
                            slot.companyId,
                            slot.creditTypeId,
                            required,
                        );
                    },
                },
                reserveOp(ctx, { ttlMs: [100, 800], maxQuarters: 300 }),
                consumeOp(ctx),
                sweepOp(ctx),
                advanceOp(ctx, 3),
                expiredProbeOp(ctx, 1),
            ];
            return {
                ops,
                verify: async () => {
                    const violations = await verifyInvariants(ctx, {});
                    const entry = await ctx.leases.get(slot.companyId, slot.creditTypeId);
                    if (entry && entry.expiresAt.getTime() > ctx.clock.now()) {
                        if (server.released.has(entry.leaseId)) {
                            violations.push(
                                `live installed lease ${entry.leaseId} was released server-side ` +
                                    `(a redundant-release pulled the shared lease out from under siblings)`,
                            );
                        }
                        const srv = server.leasesById.get(entry.leaseId);
                        if (!srv) {
                            violations.push(`installed lease ${entry.leaseId} is unknown to the server`);
                        } else if (entry.grantedAmount > srv.granted + 1e-9) {
                            violations.push(
                                `local granted ${entry.grantedAmount} exceeds server-authoritative total ` +
                                    `${srv.granted} for ${entry.leaseId} (phantom extend credits)`,
                            );
                        }
                    }
                    return violations;
                },
            };
        },
    },
];

describe("lease/reservation concurrency race harness", () => {
    for (const scenario of scenarios) {
        for (const backend of backends) {
            test(`${scenario.name} [${backend.name}] — ${seeds.length} seeded schedule(s)`, async () => {
                for (const seed of seeds) {
                    await runScenario(scenario, backend, seed);
                }
            });
        }
    }
});
