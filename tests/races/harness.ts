/**
 * Seeded randomized race harness for the lease/reservation stores.
 *
 * The conformance suite pins sequential semantics with deterministic vectors;
 * the truly concurrent interleavings (single-flight, extend-vs-expiry,
 * release-vs-sweeper, replace-vs-reserve) are prose invariants there. This
 * harness exercises exactly those: per seed it spawns N async workers sharing
 * a small set of (company, creditType) slots, each running a randomized op
 * sequence against the store API with seeded micro-yields injected between
 * store calls so the event-loop interleaving varies by seed. At quiescence it
 * asserts the prose invariants (conservation, bounded leak, expiry
 * monotonicity, pinned refunds/extends, exactly-once claims).
 *
 * Determinism: everything (op choice, amounts, yields, virtual-clock
 * advances) draws from PRNGs derived from the seed, ids are counters, and the
 * only awaited primitives are microtasks and `setImmediate` — whose relative
 * ordering Node schedules deterministically — so a seed replays the exact
 * schedule. `RACE_SEED=<n>` re-runs one seed; `RACE_ITERATIONS=<n>` scales the
 * batch.
 */
import type { ILeaseStore } from "../../src/credits/lease-store";
import { LeaseStore } from "../../src/credits/lease-store";
import { RedisLeaseStore } from "../../src/credits/redis-lease-store";
import { RedisReservationStore } from "../../src/credits/redis-reservation-store";
import type { IReservationStore } from "../../src/credits/reservation-store";
import { ReservationStore } from "../../src/credits/reservation-store";
import type { Reservation } from "../../src/credits/types";
import { makeFakeRedis } from "../unit/credits/fake-redis";
import { deriveSeed, Rng } from "./prng";

const EPS = 1e-9;

export interface Slot {
    companyId: string;
    creditTypeId: string;
}

export function slotKeyOf(slot: Slot): string {
    return `${slot.companyId}:${slot.creditTypeId}`;
}

// ---------------------------------------------------------------------------
// Virtual clock
//
// Both stores (and fake-redis's TTL eviction) decide expiry via `Date.now()`,
// so overriding it gives the harness full, deterministic control of the
// timeline — clock advances are ordinary synchronous ops workers race against
// reserves/extends/sweeps. (The real Redis store reads the *server* clock via
// TIME; fake-redis emulates that with `Date.now()`, which this override also
// controls. The opt-in real-Redis integration suite is where server-clock
// authority itself is exercised.)
// ---------------------------------------------------------------------------

export interface VirtualClock {
    now(): number;
    advance(ms: number): void;
    uninstall(): void;
}

const CLOCK_EPOCH_MS = 1_700_000_000_000;

export function installVirtualClock(): VirtualClock {
    const realNow = Date.now;
    let current = CLOCK_EPOCH_MS;
    Date.now = () => current;
    return {
        now: () => current,
        advance: (ms: number) => {
            current += ms;
        },
        uninstall: () => {
            Date.now = realNow;
        },
    };
}

// ---------------------------------------------------------------------------
// Interleaving control
// ---------------------------------------------------------------------------

/**
 * Seeded micro-yield: 0-3 awaits, each either a microtask or a macrotask
 * (`setImmediate`). Workers call this between store operations so the
 * interleaving of their op sequences varies by seed. `setTimeout(0)` is
 * deliberately excluded — its ordering relative to `setImmediate` is not
 * deterministic in Node, which would break seed replay.
 */
export async function jitter(rng: Rng): Promise<void> {
    const yields = rng.int(4);
    for (let i = 0; i < yields; i++) {
        if (rng.chance(0.5)) {
            await Promise.resolve();
        } else {
            await new Promise<void>((resolve) => setImmediate(resolve));
        }
    }
}

/** Drain pending microtasks/immediates (e.g. fire-and-forget releases) before verifying. */
export async function settle(rounds = 25): Promise<void> {
    for (let i = 0; i < rounds; i++) {
        await new Promise<void>((resolve) => setImmediate(resolve));
    }
}

/**
 * Credit amounts are multiples of 0.25: fractional (exercising the Redis
 * string-balance encoding) but exactly representable in binary, so the
 * conservation sums below can be compared exactly.
 */
export function quarters(rng: Rng, maxQuarters: number, minQuarters = 1): number {
    return rng.intBetween(minQuarters, maxQuarters) * 0.25;
}

// ---------------------------------------------------------------------------
// Backends
// ---------------------------------------------------------------------------

export interface StorePair {
    leases: ILeaseStore;
    reservations: IReservationStore;
}

export interface Backend {
    name: string;
    make(): StorePair;
}

// The sweep interval is irrelevant here (workers call `sweepExpired`
// explicitly, racing it against consumes); set it long so a stray
// `startSweep` could never fire mid-run.
export const backends: Backend[] = [
    {
        name: "in-memory",
        make: () => {
            const leases = new LeaseStore();
            return { leases, reservations: new ReservationStore(leases, 60_000) };
        },
    },
    {
        name: "redis (fake)",
        make: () => {
            const client = makeFakeRedis();
            const leases = new RedisLeaseStore({ client });
            return {
                leases,
                reservations: new RedisReservationStore({ client, leaseStore: leases, sweepIntervalMs: 60_000 }),
            };
        },
    },
];

// ---------------------------------------------------------------------------
// Model: what the harness knows it asked the stores to do
// ---------------------------------------------------------------------------

export interface OpenReservation {
    slotKey: string;
    leaseId: string;
    credits: number;
}

export class RaceModel {
    /** Leases whose `replace` returned written=true, keyed by lease id (ids are never reused). */
    installs = new Map<string, { slotKey: string; granted: number; expiresAtMs: number }>();
    /** Every store `extend` issued, with its pin. Pins are only ever ids observed live in the slot. */
    extendsIssued: Array<{ pinLeaseId: string; total: number; expiresAtMs: number }> = [];
    /** Reservations recorded via `add` and not yet claimed by a non-null `consume` this run. */
    open = new Map<string, OpenReservation>();
    /** Per-slot credits actually consumed (sum of non-null `consume` returns). */
    consumed = new Map<string, number>();
    /** Per-slot credits deliberately leaked via simulated window-1 crashes (debit without record). */
    leaked = new Map<string, number>();
    /** Per-reservation count of non-null `consume` returns (must be <= 1). */
    claims = new Map<string, number>();
    /** Op-time violations (non-racy assertions checked inline). */
    violations: string[] = [];

    addTo(map: Map<string, number>, key: string, credits: number): void {
        map.set(key, (map.get(key) ?? 0) + credits);
    }
}

export interface RaceCtx {
    seed: number;
    clock: VirtualClock;
    leases: ILeaseStore;
    reservations: IReservationStore;
    slots: Slot[];
    model: RaceModel;
    nextId(prefix: string): string;
}

export function makeReservation(
    ctx: RaceCtx,
    slot: Slot,
    leaseId: string,
    credits: number,
    ttlMs: number,
): Reservation {
    return {
        id: ctx.nextId("res"),
        leaseId,
        companyId: slot.companyId,
        creditTypeId: slot.creditTypeId,
        eventSubtype: "inference_tokens",
        quantityReserved: credits,
        creditsReserved: credits,
        consumptionRate: 1,
        expiresAt: new Date(ctx.clock.now() + ttlMs),
        evalCtx: { company: { id: slot.companyId } },
    };
}

// ---------------------------------------------------------------------------
// Shared ops
// ---------------------------------------------------------------------------

export interface WeightedOp {
    weight: number;
    run(rng: Rng): Promise<void>;
}

export interface ReserveOpts {
    /** Probability of simulating a window-1 crash (debit lands, record never written). */
    crashChance?: number;
    /** Reservation TTL range [min, max] ms. */
    ttlMs: [number, number];
    /** Max reserve size in quarter-credits. */
    maxQuarters: number;
}

/**
 * The check-flow shape: observe the lease (skipping expired ones, like the
 * manager does), debit via `try_reserve`, then record the reservation pinned
 * to the OBSERVED lease id — deliberately leaving seeded yield points where
 * expiry, a successor `replace`, or a sweep can interleave.
 */
export function reserveOp(ctx: RaceCtx, opts: ReserveOpts): WeightedOp {
    return {
        weight: 4,
        run: async (rng) => {
            const slot = rng.pick(ctx.slots);
            const entry = await ctx.leases.get(slot.companyId, slot.creditTypeId);
            if (!entry || entry.expiresAt.getTime() <= ctx.clock.now()) return;
            const credits = quarters(rng, opts.maxQuarters);
            await jitter(rng);
            const post = await ctx.leases.tryReserve(slot.companyId, slot.creditTypeId, credits);
            if (post === null) return;
            if (post < -EPS) {
                ctx.model.violations.push(
                    `tryReserve(${credits}) on ${slotKeyOf(slot)} returned a negative balance ${post}`,
                );
            }
            await jitter(rng);
            if (opts.crashChance && rng.chance(opts.crashChance)) {
                // Simulated window-1 crash: the debit landed but the record is
                // never written. The sweeper can never refund it; conservation
                // accounts for it via the leak budget.
                ctx.model.addTo(ctx.model.leaked, slotKeyOf(slot), credits);
                return;
            }
            const reservation = makeReservation(ctx, slot, entry.leaseId, credits, rng.intBetween(...opts.ttlMs));
            await ctx.reservations.add(reservation);
            ctx.model.open.set(reservation.id, { slotKey: slotKeyOf(slot), leaseId: entry.leaseId, credits });
        },
    };
}

/** Settle a random open reservation — racing other consumers and the sweeper. */
export function consumeOp(ctx: RaceCtx): WeightedOp {
    return {
        weight: 3,
        run: async (rng) => {
            const ids = Array.from(ctx.model.open.keys());
            if (ids.length === 0) return;
            const id = rng.pick(ids);
            const open = ctx.model.open.get(id);
            if (!open) return;
            const roll = rng.next();
            let requested: number;
            if (roll < 0.15) {
                requested = open.credits + quarters(rng, 20); // over-consume: clamps to reserved
            } else if (roll < 0.25) {
                requested = -quarters(rng, 8); // negative: clamps to 0, full refund
            } else {
                requested = quarters(rng, Math.max(1, Math.round(open.credits * 4)), 0);
            }
            await jitter(rng);
            const consumed = await ctx.reservations.consume(id, requested);
            if (consumed === null) return; // lost the claim race (sweeper or another consumer)
            if (consumed < -EPS || consumed > open.credits + EPS) {
                ctx.model.violations.push(
                    `consume(${id}, ${requested}) returned ${consumed}, outside [0, ${open.credits}]`,
                );
            }
            ctx.model.claims.set(id, (ctx.model.claims.get(id) ?? 0) + 1);
            ctx.model.addTo(ctx.model.consumed, open.slotKey, consumed);
            ctx.model.open.delete(id);
        },
    };
}

/** Run the expired-reservation sweeper — racing settles on the same reservations. */
export function sweepOp(ctx: RaceCtx): WeightedOp {
    return {
        weight: 2,
        run: async (rng) => {
            await jitter(rng);
            await ctx.reservations.sweepExpired(new Date(ctx.clock.now()));
        },
    };
}

/**
 * Advance the virtual clock. Bounded to 300ms per op so a run's total advance
 * stays well under the stores' TTL grace windows (30s reservation / 60s
 * lease): rows must never TTL-evict un-swept mid-run, which would look like a
 * lost refund to the conservation check.
 */
export function advanceOp(ctx: RaceCtx, weight = 2): WeightedOp {
    return {
        weight,
        run: async (rng) => {
            ctx.clock.advance(rng.intBetween(50, 300));
        },
    };
}

/** Non-finite/negative debits must be rejected without touching the balance. */
export function invalidReserveOp(ctx: RaceCtx): WeightedOp {
    return {
        weight: 1,
        run: async (rng) => {
            const slot = rng.pick(ctx.slots);
            const bad = rng.pick([Number.NaN, -3, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]);
            const result = await ctx.leases.tryReserve(slot.companyId, slot.creditTypeId, bad);
            if (result !== null) {
                ctx.model.violations.push(`tryReserve(${bad}) on ${slotKeyOf(slot)} returned ${result}, not null`);
            }
        },
    };
}

/**
 * The manager's extend shape: observe the lease (skipping expired ones),
 * then reconcile the store to a server-authoritative total pinned to the
 * observed lease id — racing expiry and successor installs.
 */
export function extendObservedOp(ctx: RaceCtx, durationMs: [number, number]): WeightedOp {
    return {
        weight: 3,
        run: async (rng) => {
            const slot = rng.pick(ctx.slots);
            const entry = await ctx.leases.get(slot.companyId, slot.creditTypeId);
            if (!entry || entry.expiresAt.getTime() <= ctx.clock.now()) return;
            // Mix of higher totals (real extends) and stale/lower totals
            // (out-of-order applies that must converge as no-ops).
            const total = entry.grantedAmount + rng.pick([-50, -0.25, 25, 100, 250.5]);
            const expiresAtMs = ctx.clock.now() + rng.intBetween(...durationMs);
            await jitter(rng);
            await ctx.leases.extend(slot.companyId, slot.creditTypeId, total, new Date(expiresAtMs), entry.leaseId);
            ctx.model.extendsIssued.push({ pinLeaseId: entry.leaseId, total, expiresAtMs });
        },
    };
}

export interface ReplaceOpts {
    /** Lease duration range, or "immortal" for a lease that can never expire mid-run. */
    durationMs: [number, number] | "immortal";
    grantedQuarters: [number, number];
    weight?: number;
    /** Only attempt the replace when the observed slot is empty/expired (the manager's shape). */
    onlyIfDead?: boolean;
}

/** Install a fresh lease — racing sibling installs (keep-first) and in-flight reserves. */
export function replaceFreshOp(ctx: RaceCtx, opts: ReplaceOpts): WeightedOp {
    return {
        weight: opts.weight ?? 2,
        run: async (rng) => {
            const slot = rng.pick(ctx.slots);
            if (opts.onlyIfDead) {
                const current = await ctx.leases.get(slot.companyId, slot.creditTypeId);
                if (current && current.expiresAt.getTime() > ctx.clock.now()) return;
                await jitter(rng);
            }
            const granted = quarters(rng, opts.grantedQuarters[1], opts.grantedQuarters[0]);
            const expiresAtMs =
                opts.durationMs === "immortal"
                    ? ctx.clock.now() + 10 * 365 * 24 * 60 * 60 * 1000
                    : ctx.clock.now() + rng.intBetween(...opts.durationMs);
            const leaseId = ctx.nextId("lse");
            const wrote = await ctx.leases.replace({
                leaseId,
                companyId: slot.companyId,
                creditTypeId: slot.creditTypeId,
                grantedAmount: granted,
                expiresAt: new Date(expiresAtMs),
            });
            if (wrote) {
                ctx.model.installs.set(leaseId, { slotKey: slotKeyOf(slot), granted, expiresAtMs });
            }
        },
    };
}

/**
 * Prove the expiry guard: observe the lease, synchronously advance the clock
 * just past its expiry, and immediately probe `try_reserve`. The advance and
 * the call have no yield between them, so any debit happens at
 * `clock >= advancedTo`. If the probe succeeds and the slot still holds the
 * SAME lease with an expiry `<= advancedTo`, the debit provably landed on an
 * expired lease (ids are never reused and expiry only moves forward, so a
 * live-at-debit lease would read a later expiry afterwards) — a
 * server-side double-spend the local ledger alone cannot see. A success where
 * the slot moved on to a live successor is legitimate (the debit hit the
 * successor); it is accounted as an unrecorded hold, like a window-1 crash.
 */
export function expiredProbeOp(ctx: RaceCtx, weight = 2): WeightedOp {
    return {
        weight,
        run: async (rng) => {
            const slot = rng.pick(ctx.slots);
            const before = await ctx.leases.get(slot.companyId, slot.creditTypeId);
            if (!before) return;
            const advancedTo = Math.max(ctx.clock.now(), before.expiresAt.getTime() + 1);
            ctx.clock.advance(advancedTo - ctx.clock.now());
            const credits = 0.25;
            const post = await ctx.leases.tryReserve(slot.companyId, slot.creditTypeId, credits);
            if (post === null) return;
            const after = await ctx.leases.get(slot.companyId, slot.creditTypeId);
            if (after && after.leaseId === before.leaseId && after.expiresAt.getTime() <= advancedTo) {
                ctx.model.violations.push(
                    `${slotKeyOf(slot)}: tryReserve succeeded against expired lease ${before.leaseId} ` +
                        `(expiry ${after.expiresAt.getTime()} <= clock ${advancedTo}; ` +
                        `the server already refunded this balance — serving it double-spends)`,
                );
                return;
            }
            // Legitimate: the debit landed on a live successor. Nothing records
            // this hold, so account it like a window-1 crash leak.
            ctx.model.addTo(ctx.model.leaked, slotKeyOf(slot), credits);
        },
    };
}

/** Drop the slot (remote release) — racing everything else. */
export function dropOp(ctx: RaceCtx, weight = 1): WeightedOp {
    return {
        weight,
        run: async (rng) => {
            const slot = rng.pick(ctx.slots);
            await jitter(rng);
            await ctx.leases.drop(slot.companyId, slot.creditTypeId);
        },
    };
}

// ---------------------------------------------------------------------------
// Invariant verification (at quiescence)
// ---------------------------------------------------------------------------

export interface VerifyOpts {
    /**
     * Exact conservation: granted == remaining + open holds + consumed +
     * crash-leaked, per slot. Only sound when the scenario guarantees a single
     * never-expiring lease per slot (attribution of debits is then exact); it
     * catches both double-refunds and lost refunds.
     */
    conservation?: boolean;
    /**
     * Assert the exact final granted/expiry of the surviving lease from the
     * model (install + pinned extends). Sound whenever the harness only pins
     * extends to observed-live lease ids (ids are never reused, so a lease
     * still installed at quiescence was installed continuously since its
     * `replace` — every extend pinned to it applied). Off for manager-driven
     * scenarios where installs happen inside the manager.
     */
    exactLeaseState?: boolean;
    /** Require every slot to still hold a known lease (single-immortal-lease scenarios). */
    requireLease?: boolean;
}

export async function verifyInvariants(ctx: RaceCtx, opts: VerifyOpts): Promise<string[]> {
    const violations: string[] = [...ctx.model.violations];

    // Reconcile the model's open reservations against the store: ones the
    // sweeper claimed are gone (their hold refunded to the lease); ones still
    // present are open holds.
    const presentBySlot = new Map<string, OpenReservation[]>();
    for (const [id, open] of ctx.model.open) {
        const inStore = await ctx.reservations.get(id);
        if (!inStore) continue; // swept: full hold refunded (pinned), counts as consumed 0
        const list = presentBySlot.get(open.slotKey) ?? [];
        list.push(open);
        presentBySlot.set(open.slotKey, list);
    }

    for (const slot of ctx.slots) {
        const key = slotKeyOf(slot);
        const present = presentBySlot.get(key) ?? [];
        const presentSum = present.reduce((sum, r) => sum + r.credits, 0);

        // The reserved-credits index (a separate structure in the Redis store)
        // must agree exactly with the reservations actually present.
        const reservedTotal = await ctx.reservations.reservedCredits(slot.companyId, slot.creditTypeId);
        if (Math.abs(reservedTotal - presentSum) > EPS) {
            violations.push(
                `${key}: reservedCredits reports ${reservedTotal} but open reservations sum to ${presentSum}`,
            );
        }

        const entry = await ctx.leases.get(slot.companyId, slot.creditTypeId);
        if (!entry) {
            if (opts.requireLease) violations.push(`${key}: expected the immortal lease to survive, slot is empty`);
            continue;
        }

        const remaining = entry.localRemainingCredits;
        const granted = entry.grantedAmount;
        if (remaining < -EPS) violations.push(`${key}: negative balance ${remaining} on lease ${entry.leaseId}`);
        if (remaining > granted + EPS) {
            violations.push(`${key}: balance ${remaining} exceeds granted ${granted} on lease ${entry.leaseId}`);
        }

        // No double-spend: credits held by open reservations pinned to the
        // live lease were debited from it, so remaining + holds can never
        // exceed granted. A double-refund or a refund crossing lease
        // generations (a broken pin) pushes this over.
        const pinnedOpen = present.filter((r) => r.leaseId === entry.leaseId).reduce((sum, r) => sum + r.credits, 0);
        if (remaining + pinnedOpen > granted + EPS) {
            violations.push(
                `${key}: remaining ${remaining} + pinned open holds ${pinnedOpen} exceeds granted ${granted} ` +
                    `on lease ${entry.leaseId} (credits were minted)`,
            );
        }

        const install = ctx.model.installs.get(entry.leaseId);
        if (opts.exactLeaseState) {
            if (!install) {
                violations.push(`${key}: slot holds lease ${entry.leaseId} the harness never installed`);
            } else {
                const pinnedExtends = ctx.model.extendsIssued.filter((e) => e.pinLeaseId === entry.leaseId);
                const expectedGranted = Math.max(install.granted, ...pinnedExtends.map((e) => e.total));
                const expectedExpiry = Math.max(install.expiresAtMs, ...pinnedExtends.map((e) => e.expiresAtMs));
                if (Math.abs(granted - expectedGranted) > EPS) {
                    violations.push(
                        `${key}: lease ${entry.leaseId} granted ${granted}, expected ${expectedGranted} ` +
                            `(install ${install.granted} + ${pinnedExtends.length} pinned extends; ` +
                            `an unpinned/stale extend leaked through)`,
                    );
                }
                if (entry.expiresAt.getTime() !== expectedExpiry) {
                    violations.push(
                        `${key}: lease ${entry.leaseId} expiry ${entry.expiresAt.getTime()}, expected ${expectedExpiry} ` +
                            `(expiry must equal the max of install + pinned extend expiries — it only moves forward)`,
                    );
                }
            }
        }

        if (opts.conservation) {
            const consumed = ctx.model.consumed.get(key) ?? 0;
            const leaked = ctx.model.leaked.get(key) ?? 0;
            const accounted = remaining + presentSum + consumed + leaked;
            if (Math.abs(accounted - granted) > EPS) {
                violations.push(
                    `${key}: conservation broken on lease ${entry.leaseId}: remaining ${remaining} + ` +
                        `open holds ${presentSum} + consumed ${consumed} + crash-leaked ${leaked} ` +
                        `= ${accounted}, expected granted ${granted} ` +
                        `(${accounted > granted ? "double refund" : "lost refund"})`,
                );
            }
        }
    }

    for (const [id, count] of ctx.model.claims) {
        if (count > 1) violations.push(`reservation ${id} was claimed ${count} times (consume must be exactly-once)`);
    }

    return violations;
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export interface ScenarioRun {
    ops: WeightedOp[];
    verify(): Promise<string[]>;
}

export interface RaceScenario {
    name: string;
    slots: Slot[];
    build(ctx: RaceCtx): Promise<ScenarioRun>;
}

function pickWeighted(ops: WeightedOp[], rng: Rng): WeightedOp {
    const total = ops.reduce((sum, op) => sum + op.weight, 0);
    let roll = rng.next() * total;
    for (const op of ops) {
        roll -= op.weight;
        if (roll < 0) return op;
    }
    return ops[ops.length - 1];
}

export async function runScenario(scenario: RaceScenario, backend: Backend, seed: number): Promise<void> {
    const rng = new Rng(deriveSeed(seed, 0));
    const clock = installVirtualClock();
    try {
        const { leases, reservations } = backend.make();
        let idCounter = 0;
        const ctx: RaceCtx = {
            seed,
            clock,
            leases,
            reservations,
            slots: scenario.slots,
            model: new RaceModel(),
            nextId: (prefix: string) => `${prefix}_${seed}_${++idCounter}`,
        };
        const { ops, verify } = await scenario.build(ctx);

        const workerCount = rng.intBetween(3, 6);
        const opsPerWorker = rng.intBetween(6, 12);
        await Promise.all(
            Array.from({ length: workerCount }, (_, workerIndex) => {
                const workerRng = new Rng(deriveSeed(seed, workerIndex + 1));
                return (async () => {
                    for (let i = 0; i < opsPerWorker; i++) {
                        await jitter(workerRng);
                        await pickWeighted(ops, workerRng).run(workerRng);
                    }
                })();
            }),
        );

        // Quiescence: all workers idle; drain anything fire-and-forget, then
        // run one final sweep. The sweep reconciles reservation rows the
        // backend TTL-evicted after large clock jumps (their per-slot index
        // fields would otherwise read as reserved-credits drift) — the same
        // reconciliation the production sweep loop performs.
        await settle();
        await reservations.sweepExpired(new Date(clock.now()));

        const violations = await verify();
        if (violations.length > 0) {
            throw new Error(
                `Race invariant violated (scenario="${scenario.name}", backend="${backend.name}", seed=${seed}, ` +
                    `workers=${workerCount}, opsPerWorker=${opsPerWorker})\n` +
                    `Replay exactly this schedule with: RACE_SEED=${seed} yarn test tests/races\n` +
                    violations.map((v) => `  - ${v}`).join("\n"),
            );
        }
    } finally {
        clock.uninstall();
    }
}

/** Seeds for this run: `RACE_SEED` replays one; `RACE_ITERATIONS` scales the batch. */
export function seedBatch(defaultIterations: number): number[] {
    const single = process.env.RACE_SEED;
    if (single !== undefined && single !== "") {
        const seed = Number(single);
        if (!Number.isInteger(seed)) throw new Error(`RACE_SEED must be an integer, got "${single}"`);
        return [seed];
    }
    const iterations = Number(process.env.RACE_ITERATIONS ?? defaultIterations);
    if (!Number.isInteger(iterations) || iterations < 1) {
        throw new Error(`RACE_ITERATIONS must be a positive integer, got "${process.env.RACE_ITERATIONS}"`);
    }
    return Array.from({ length: iterations }, (_, i) => i + 1);
}
