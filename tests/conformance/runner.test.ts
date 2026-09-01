/**
 * Executes the language-agnostic conformance vectors in `conformance/vectors/`
 * against the reference implementation, on both store backends. The vector
 * schema and the semantics they pin are documented in `conformance/SPEC.md`;
 * ports of the lease/reservation system reimplement this runner (it is the
 * only language-specific piece) and must pass the same vectors.
 */
import * as fs from "fs";
import * as path from "path";

import type * as api from "../../src/api";
import type { CreditsClient } from "../../src/api/resources/credits/client/Client";
import { type CreditCheckDeps, checkWithLease } from "../../src/credits/check";
import { CreditLeaseManager } from "../../src/credits/lease-manager";
import { type ILeaseStore, LeaseStore } from "../../src/credits/lease-store";
import { RedisLeaseStore } from "../../src/credits/redis-lease-store";
import { RedisReservationStore } from "../../src/credits/redis-reservation-store";
import { type IReservationStore, ReservationStore } from "../../src/credits/reservation-store";
import { consumeReservationAndBuildEvent } from "../../src/credits/track";
import type { CheckOptions, CheckResult, OnAcquireFailure, Reservation } from "../../src/credits/types";
import type { DataStreamClient } from "../../src/datastream";
import type { Logger } from "../../src/logger";
import { makeFakeRedis } from "../unit/credits/fake-redis";

// ---------------------------------------------------------------------------
// Vector schema (see conformance/SPEC.md — keys are snake_case JSON).

interface LeaseSpec {
    lease_id: string;
    company_id: string;
    credit_type_id: string;
    granted_amount: number;
    expires_at_ms: number;
}

interface ConfigSpec {
    lease_duration_ms?: number;
    reservation_ttl_ms?: number;
    lease_size?: number;
    low_water_mark?: number;
}

interface ServerLeaseSpec {
    lease_id?: string;
    granted_amount?: number;
    granted_total?: number;
    expires_at_ms: number;
}

type ServerScript = { lease: ServerLeaseSpec; error?: undefined } | { error: string; lease?: undefined };

interface EngineEntitlementSpec {
    value_type: string;
    credit_id?: string;
    consumption_rate?: number;
    event_subtype?: string;
}

interface EngineResultSpec {
    value: boolean;
    reason?: string;
    entitlement?: EngineEntitlementSpec;
}

interface EngineCallExpect {
    credit_balance?: number | "max_safe_integer";
    credit_cost?: number;
    event_usage?: { event_subtype: string; quantity: number };
    usage?: number;
}

interface OpExpect {
    written?: boolean;
    balance?: number | null;
    consumed?: number | null;
    throws?: boolean;
    exists?: boolean;
    lease_id?: string | null;
    granted_amount?: number;
    local_remaining_credits?: number;
    total?: number;
    count?: number;
    swept?: number;
    wire_acquires?: number;
    last_acquire_requested_amount?: number;
    released_lease_ids?: string[];
    wire_extends?: number;
    last_extend_additional_amount?: number;
    last_extend_lease_id?: string;
    allowed?: boolean;
    reason?: string;
    err?: string;
    has_reservation?: boolean;
    reservation?: {
        lease_id?: string;
        credit_type_id?: string;
        event_subtype?: string;
        quantity_reserved?: number;
        credits_reserved?: number;
        consumption_rate?: number;
    };
    engine_calls?: EngineCallExpect[];
    fallback_called?: boolean;
    settled_locally?: boolean;
    track?: { event?: string; quantity?: number; lease_id?: string };
}

interface Operation {
    op: string;
    expect?: OpExpect;
    // advance_clock
    ms?: number;
    // lease / reservation store ops
    lease_id?: string;
    company_id?: string;
    credit_type_id?: string;
    granted_amount?: number;
    expires_at_ms?: number;
    credits?: number;
    pin_lease_id?: string;
    granted_total?: number;
    id?: string;
    handle?: string;
    event_subtype?: string;
    quantity_reserved?: number;
    credits_reserved?: number;
    consumption_rate?: number;
    crash_before_refund?: boolean;
    // manager ops
    required_credits?: number;
    server?: ServerScript | { acquire?: ServerScript; extend?: ServerScript };
    install_during_wire?: LeaseSpec;
    // check / track ops
    flag_key?: string;
    company?: { id: string; credit_balances?: Record<string, number> };
    usage?: number;
    on_acquire_failure?: string;
    engine?: EngineResultSpec[];
    save_reservation_as?: string;
    actual_quantity?: number;
}

interface Vector {
    name: string;
    description: string;
    backends?: string[];
    given?: { config?: ConfigSpec; leases?: LeaseSpec[] };
    operations: Operation[];
}

interface VectorDoc {
    category: string;
    vectors: Vector[];
}

const VECTORS_DIR = path.join(__dirname, "..", "..", "conformance", "vectors");
const documents: VectorDoc[] = fs
    .readdirSync(VECTORS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(VECTORS_DIR, f), "utf8")) as VectorDoc);

// ---------------------------------------------------------------------------
// Backends. The crash hook interposes on the lease store the RESERVATION
// store refunds through (the consume-then-refund window); every other path
// uses the raw store. One-shot: it disarms itself when it fires.

interface Stores {
    leases: ILeaseStore;
    reservations: IReservationStore;
    armCrash: () => void;
}

function crashableRefund(target: ILeaseStore): { store: ILeaseStore; arm: () => void } {
    let armed = false;
    return {
        arm: () => {
            armed = true;
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
                    armed = false;
                    throw new Error("simulated crash before refund");
                }
                return target.refund(companyId, creditTypeId, credits, leaseId);
            },
        },
    };
}

const backends: Array<["in_memory" | "redis", () => Stores]> = [
    [
        "in_memory",
        () => {
            const leases = new LeaseStore();
            const crash = crashableRefund(leases);
            return { leases, reservations: new ReservationStore(crash.store, 60_000), armCrash: crash.arm };
        },
    ],
    [
        "redis",
        () => {
            const client = makeFakeRedis();
            const leases = new RedisLeaseStore({ client });
            const crash = crashableRefund(leases);
            return {
                leases,
                reservations: new RedisReservationStore({ client, leaseStore: crash.store, sweepIntervalMs: 60_000 }),
                armCrash: crash.arm,
            };
        },
    ],
];

// ---------------------------------------------------------------------------
// Harness

const T0 = new Date("2026-01-01T00:00:00Z").getTime();

const silentLogger: Logger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} };

// Let floating fire-and-forget promise chains (background extend, redundant
// release) settle. Only microtasks are involved — no timers.
async function drain(): Promise<void> {
    for (let i = 0; i < 20; i++) {
        await Promise.resolve();
    }
}

interface RecordedEngineCall {
    creditBalances: Record<string, number> | undefined;
    creditCost: Record<string, number> | undefined;
    eventUsage: { eventSubtype: string; quantity: number } | undefined;
    usage: number | undefined;
}

class Harness {
    readonly handles = new Map<string, Reservation>();
    readonly acquireResponses: ServerScript[] = [];
    readonly extendResponses: ServerScript[] = [];
    readonly acquireCalls: api.AcquireCreditLeaseRequestBody[] = [];
    readonly extendCalls: Array<{ leaseId: string; body: api.ExtendCreditLeaseRequestBody }> = [];
    readonly releaseCalls: string[] = [];
    installDuringWire: LeaseSpec | undefined;
    readonly manager: CreditLeaseManager;
    private elapsed = 0;

    constructor(
        readonly stores: Stores,
        config: ConfigSpec,
    ) {
        const creditsClient = {
            acquireCreditLease: async (body: api.AcquireCreditLeaseRequestBody) => {
                this.acquireCalls.push(body);
                const install = this.installDuringWire;
                if (install) {
                    this.installDuringWire = undefined;
                    await this.stores.leases.replace({
                        leaseId: install.lease_id,
                        companyId: install.company_id,
                        creditTypeId: install.credit_type_id,
                        grantedAmount: install.granted_amount,
                        expiresAt: this.atMs(install.expires_at_ms),
                    });
                }
                const scripted = this.acquireResponses.shift();
                if (!scripted || scripted.error !== undefined || !scripted.lease) {
                    throw new Error(scripted?.error ?? "unscripted acquire wire call");
                }
                const lease = scripted.lease;
                return {
                    data: {
                        id: lease.lease_id ?? "lse_unnamed",
                        companyId: body.companyId,
                        creditTypeId: body.creditTypeId,
                        grantedAmount: lease.granted_amount ?? 0,
                        expiresAt: this.atMs(lease.expires_at_ms),
                        createdAt: this.atMs(0),
                        updatedAt: this.atMs(0),
                    },
                    params: {},
                };
            },
            extendCreditLease: async (leaseId: string, body: api.ExtendCreditLeaseRequestBody) => {
                this.extendCalls.push({ leaseId, body });
                const scripted = this.extendResponses.shift();
                if (!scripted || scripted.error !== undefined || !scripted.lease) {
                    throw new Error(scripted?.error ?? "unscripted extend wire call");
                }
                const lease = scripted.lease;
                return {
                    data: {
                        id: leaseId,
                        companyId: "co_wire",
                        creditTypeId: "ct_wire",
                        grantedAmount: lease.granted_total ?? 0,
                        expiresAt: this.atMs(lease.expires_at_ms),
                        createdAt: this.atMs(0),
                        updatedAt: this.atMs(0),
                    },
                    params: {},
                };
            },
            releaseCreditLease: async (leaseId: string) => {
                this.releaseCalls.push(leaseId);
                return { data: {}, params: {} };
            },
        } as unknown as CreditsClient;
        this.manager = new CreditLeaseManager({
            creditsClient,
            leaseStore: stores.leases,
            logger: silentLogger,
            config: {
                defaultLeaseDuration: config.lease_duration_ms,
                defaultReservationTTL: config.reservation_ttl_ms,
                defaultLeaseSize: config.lease_size,
                lowWaterMark: config.low_water_mark,
            },
        });
    }

    atMs(offset: number): Date {
        return new Date(T0 + offset);
    }

    advance(ms: number): void {
        this.elapsed += ms;
        jest.setSystemTime(T0 + this.elapsed);
    }

    setServer(server: Operation["server"]): void {
        if (!server) return;
        if ("lease" in server || "error" in server) {
            // Manager ops script a single call directly.
            return;
        }
        if (server.acquire) this.acquireResponses.push(server.acquire);
        if (server.extend) this.extendResponses.push(server.extend);
    }

    resolveReservation(op: Operation): string {
        if (op.handle !== undefined) {
            const reservation = this.handles.get(op.handle);
            if (!reservation) throw new Error(`unknown reservation handle: ${op.handle}`);
            return reservation.id;
        }
        if (op.id === undefined) throw new Error(`op ${op.op} needs an id or handle`);
        return op.id;
    }
}

function mapEntitlement(spec: EngineEntitlementSpec, flagKey: string) {
    return {
        featureId: "feat_1",
        featureKey: flagKey,
        valueType: spec.value_type,
        creditId: spec.credit_id,
        consumptionRate: spec.consumption_rate,
        eventSubtype: spec.event_subtype,
    };
}

async function runCheck(
    h: Harness,
    op: Operation,
): Promise<{ result: CheckResult; engineCalls: RecordedEngineCall[]; fallbackCalled: boolean }> {
    const flagKey = op.flag_key ?? "flag";
    const company = op.company ?? { id: "co_1" };
    const engineResults = [...(op.engine ?? [])];
    const engineCalls: RecordedEngineCall[] = [];
    const engine = {
        checkFlagWithOptions: async (
            _flag: unknown,
            evalCompany: { creditBalances?: Record<string, number> },
            _user: unknown,
            options: {
                creditCost?: Record<string, number>;
                eventUsage?: { eventSubtype: string; quantity: number };
                usage?: number;
            } | null,
        ) => {
            engineCalls.push({
                creditBalances: evalCompany.creditBalances,
                creditCost: options?.creditCost,
                eventUsage: options?.eventUsage,
                usage: options?.usage,
            });
            const scripted = engineResults.shift();
            if (!scripted) throw new Error(`unscripted engine call in check op for flag ${flagKey}`);
            return {
                value: scripted.value,
                reason: scripted.reason,
                flagKey,
                flagId: "flag_1",
                entitlement: scripted.entitlement ? mapEntitlement(scripted.entitlement, flagKey) : undefined,
            };
        },
    };
    const datastream = {
        getFlag: async () => ({ id: "flag_1", key: flagKey }),
        getCompany: async () => ({ id: company.id, creditBalances: company.credit_balances ?? {} }),
        getUser: async () => null,
        getRulesEngine: () => engine,
    } as unknown as DataStreamClient;

    h.setServer(op.server);

    let fallbackCalled = false;
    const fallback = async (): Promise<CheckResult> => {
        fallbackCalled = true;
        return { allowed: true, value: true, reason: "fallback", flagKey };
    };

    const deps: CreditCheckDeps = {
        leaseStore: h.stores.leases,
        reservations: h.stores.reservations,
        manager: h.manager,
        datastream,
        logger: silentLogger,
        enqueueFlagCheckEvent: () => {},
    };
    const options: CheckOptions = {
        usage: op.usage,
        eventSubtype: op.event_subtype,
        onAcquireFailure: op.on_acquire_failure as OnAcquireFailure | undefined,
    };
    const result = await checkWithLease(deps, flagKey, { company: { id: company.id } }, options, fallback);
    await drain();
    return { result, engineCalls, fallbackCalled };
}

function assertEngineCalls(recorded: RecordedEngineCall[], expected: EngineCallExpect[], creditId: string | undefined) {
    expect(recorded).toHaveLength(expected.length);
    expected.forEach((want, i) => {
        const got = recorded[i];
        if (want.credit_balance !== undefined) {
            const wantBalance =
                want.credit_balance === "max_safe_integer" ? Number.MAX_SAFE_INTEGER : want.credit_balance;
            expect(creditId).toBeDefined();
            expect(got.creditBalances?.[creditId as string]).toBe(wantBalance);
        }
        if (want.credit_cost !== undefined) {
            expect(got.creditCost?.[creditId as string]).toBe(want.credit_cost);
        }
        if (want.event_usage !== undefined) {
            expect(got.eventUsage).toEqual({
                eventSubtype: want.event_usage.event_subtype,
                quantity: want.event_usage.quantity,
            });
        }
        if (want.usage !== undefined) {
            expect(got.usage).toBe(want.usage);
        }
    });
}

async function runVector(vector: Vector, makeStores: () => Stores): Promise<void> {
    const stores = makeStores();
    const h = new Harness(stores, vector.given?.config ?? {});
    try {
        for (const lease of vector.given?.leases ?? []) {
            expect(
                await stores.leases.replace({
                    leaseId: lease.lease_id,
                    companyId: lease.company_id,
                    creditTypeId: lease.credit_type_id,
                    grantedAmount: lease.granted_amount,
                    expiresAt: h.atMs(lease.expires_at_ms),
                }),
            ).toBe(true);
        }

        for (const op of vector.operations) {
            const exp = op.expect ?? {};
            switch (op.op) {
                case "advance_clock": {
                    h.advance(op.ms ?? 0);
                    break;
                }
                case "replace_lease": {
                    const written = await stores.leases.replace({
                        leaseId: op.lease_id as string,
                        companyId: op.company_id as string,
                        creditTypeId: op.credit_type_id as string,
                        grantedAmount: op.granted_amount as number,
                        expiresAt: h.atMs(op.expires_at_ms as number),
                    });
                    if (exp.written !== undefined) expect(written).toBe(exp.written);
                    break;
                }
                case "drop_lease": {
                    await stores.leases.drop(op.company_id as string, op.credit_type_id as string);
                    break;
                }
                case "try_reserve": {
                    const balance = await stores.leases.tryReserve(
                        op.company_id as string,
                        op.credit_type_id as string,
                        op.credits as number,
                    );
                    if ("balance" in exp) expect(balance).toBe(exp.balance);
                    break;
                }
                case "refund_lease": {
                    await stores.leases.refund(
                        op.company_id as string,
                        op.credit_type_id as string,
                        op.credits as number,
                        op.pin_lease_id,
                    );
                    break;
                }
                case "extend_lease": {
                    await stores.leases.extend(
                        op.company_id as string,
                        op.credit_type_id as string,
                        op.granted_total as number,
                        op.expires_at_ms !== undefined ? h.atMs(op.expires_at_ms) : undefined,
                        op.pin_lease_id,
                    );
                    break;
                }
                case "get_lease": {
                    const entry = await stores.leases.get(op.company_id as string, op.credit_type_id as string);
                    if (exp.exists !== undefined) expect(entry !== undefined).toBe(exp.exists);
                    if (exp.lease_id !== undefined) expect(entry?.leaseId).toBe(exp.lease_id);
                    if (exp.granted_amount !== undefined) expect(entry?.grantedAmount).toBe(exp.granted_amount);
                    if (exp.local_remaining_credits !== undefined) {
                        expect(entry?.localRemainingCredits).toBe(exp.local_remaining_credits);
                    }
                    break;
                }
                case "add_reservation": {
                    await stores.reservations.add({
                        id: op.id as string,
                        leaseId: op.lease_id as string,
                        companyId: op.company_id as string,
                        creditTypeId: op.credit_type_id as string,
                        eventSubtype: op.event_subtype as string,
                        quantityReserved: op.quantity_reserved as number,
                        creditsReserved: op.credits_reserved as number,
                        consumptionRate: op.consumption_rate as number,
                        expiresAt: h.atMs(op.expires_at_ms as number),
                        evalCtx: { company: { id: op.company_id as string } },
                    });
                    break;
                }
                case "consume_reservation": {
                    const id = h.resolveReservation(op);
                    if (op.crash_before_refund) {
                        stores.armCrash();
                        await expect(stores.reservations.consume(id, op.credits as number)).rejects.toThrow(
                            "simulated crash before refund",
                        );
                        expect(exp.throws).toBe(true);
                    } else {
                        const consumed = await stores.reservations.consume(id, op.credits as number);
                        if ("consumed" in exp) expect(consumed).toBe(exp.consumed);
                    }
                    break;
                }
                case "get_reservation": {
                    const reservation = await stores.reservations.get(h.resolveReservation(op));
                    if (exp.exists !== undefined) expect(reservation !== undefined).toBe(exp.exists);
                    break;
                }
                case "reserved_credits": {
                    const total = await stores.reservations.reservedCredits(
                        op.company_id as string,
                        op.credit_type_id as string,
                    );
                    expect(total).toBe(exp.total);
                    break;
                }
                case "reservation_count": {
                    expect(await stores.reservations.size()).toBe(exp.count);
                    break;
                }
                case "sweep_expired": {
                    const swept = await stores.reservations.sweepExpired(new Date());
                    if (exp.swept !== undefined) expect(swept).toBe(exp.swept);
                    break;
                }
                case "acquire_if_needed": {
                    if (op.server) h.acquireResponses.push(op.server as ServerScript);
                    if (op.install_during_wire) h.installDuringWire = op.install_during_wire;
                    const entry = await h.manager.acquireIfNeeded(op.company_id as string, op.credit_type_id as string);
                    await drain();
                    if ("lease_id" in exp) expect(entry?.leaseId ?? null).toBe(exp.lease_id);
                    if (exp.wire_acquires !== undefined) expect(h.acquireCalls).toHaveLength(exp.wire_acquires);
                    if (exp.last_acquire_requested_amount !== undefined) {
                        expect(h.acquireCalls[h.acquireCalls.length - 1]?.requestedAmount).toBe(
                            exp.last_acquire_requested_amount,
                        );
                    }
                    if (exp.released_lease_ids !== undefined) expect(h.releaseCalls).toEqual(exp.released_lease_ids);
                    break;
                }
                case "maybe_extend": {
                    if (op.server) h.extendResponses.push(op.server as ServerScript);
                    await h.manager.maybeExtendInBackground(
                        op.company_id as string,
                        op.credit_type_id as string,
                        op.required_credits,
                    );
                    await drain();
                    if (exp.wire_extends !== undefined) expect(h.extendCalls).toHaveLength(exp.wire_extends);
                    if (exp.last_extend_additional_amount !== undefined) {
                        expect(h.extendCalls[h.extendCalls.length - 1]?.body.additionalAmount).toBe(
                            exp.last_extend_additional_amount,
                        );
                    }
                    if (exp.last_extend_lease_id !== undefined) {
                        expect(h.extendCalls[h.extendCalls.length - 1]?.leaseId).toBe(exp.last_extend_lease_id);
                    }
                    break;
                }
                case "release_all_local_leases": {
                    await h.manager.releaseAllLocalLeases();
                    if (exp.released_lease_ids !== undefined) expect(h.releaseCalls).toEqual(exp.released_lease_ids);
                    break;
                }
                case "check": {
                    const { result, engineCalls, fallbackCalled } = await runCheck(h, op);
                    if (exp.allowed !== undefined) expect(result.allowed).toBe(exp.allowed);
                    if (exp.reason !== undefined) expect(result.reason).toBe(exp.reason);
                    if (exp.err !== undefined) expect(result.err).toBe(exp.err);
                    if (exp.has_reservation !== undefined) {
                        expect(result.reservation !== undefined).toBe(exp.has_reservation);
                    }
                    if (exp.fallback_called !== undefined) expect(fallbackCalled).toBe(exp.fallback_called);
                    if (exp.reservation) {
                        const r = result.reservation;
                        expect(r).toBeDefined();
                        if (exp.reservation.lease_id !== undefined) expect(r?.leaseId).toBe(exp.reservation.lease_id);
                        if (exp.reservation.credit_type_id !== undefined) {
                            expect(r?.creditTypeId).toBe(exp.reservation.credit_type_id);
                        }
                        if (exp.reservation.event_subtype !== undefined) {
                            expect(r?.eventSubtype).toBe(exp.reservation.event_subtype);
                        }
                        if (exp.reservation.quantity_reserved !== undefined) {
                            expect(r?.quantityReserved).toBe(exp.reservation.quantity_reserved);
                        }
                        if (exp.reservation.credits_reserved !== undefined) {
                            expect(r?.creditsReserved).toBe(exp.reservation.credits_reserved);
                        }
                        if (exp.reservation.consumption_rate !== undefined) {
                            expect(r?.consumptionRate).toBe(exp.reservation.consumption_rate);
                        }
                    }
                    if (exp.engine_calls !== undefined) {
                        const creditId =
                            op.engine?.find((e) => e.entitlement?.credit_id)?.entitlement?.credit_id ??
                            Object.keys(op.company?.credit_balances ?? {})[0];
                        assertEngineCalls(engineCalls, exp.engine_calls, creditId);
                    }
                    if (exp.wire_extends !== undefined) expect(h.extendCalls).toHaveLength(exp.wire_extends);
                    if (exp.last_extend_additional_amount !== undefined) {
                        expect(h.extendCalls[h.extendCalls.length - 1]?.body.additionalAmount).toBe(
                            exp.last_extend_additional_amount,
                        );
                    }
                    if (op.save_reservation_as && result.reservation) {
                        h.handles.set(op.save_reservation_as, result.reservation);
                    }
                    break;
                }
                case "track": {
                    const reservation = h.handles.get(op.handle as string);
                    if (!reservation) throw new Error(`unknown reservation handle: ${op.handle}`);
                    const { track, settledLocally } = await consumeReservationAndBuildEvent(
                        stores.reservations,
                        reservation,
                        op.actual_quantity as number,
                    );
                    if (exp.settled_locally !== undefined) expect(settledLocally).toBe(exp.settled_locally);
                    if (exp.track) {
                        if (exp.track.event !== undefined) expect(track.event).toBe(exp.track.event);
                        if (exp.track.quantity !== undefined) expect(track.quantity).toBe(exp.track.quantity);
                        if (exp.track.lease_id !== undefined) expect(track.leaseId).toBe(exp.track.lease_id);
                    }
                    break;
                }
                default:
                    throw new Error(`unknown conformance op: ${op.op}`);
            }
        }
    } finally {
        stores.reservations.stop();
    }
}

describe.each(backends)("credit lease conformance — %s", (backendName, makeStores) => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(T0);
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    for (const doc of documents) {
        describe(doc.category, () => {
            for (const vector of doc.vectors) {
                if (vector.backends && !vector.backends.includes(backendName)) continue;
                it(vector.name, async () => {
                    await runVector(vector, makeStores);
                });
            }
        });
    }
});
