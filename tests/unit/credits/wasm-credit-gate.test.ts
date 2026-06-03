/**
 * Real-WASM tests for the credit-lease check path.
 *
 * Everything else in `tests/unit/credits` stubs the rules engine, so the
 * contract that actually matters most — substituting the lease balance into
 * the company's `creditBalances` and letting the WASM's `event_usage` gate
 * decide allow/deny — is never exercised against the real engine. These tests
 * load the bundled WASM (`src/wasm/rulesengine.js`) and drive a credit-balance
 * flag end-to-end through `checkWithLease`, plus a direct rules-engine check, so
 * that a drift in the snake_case option envelope (`event_usage`) or in the
 * camelCase entity shape the SDK now feeds the engine would fail here instead of
 * silently mis-gating in production.
 */
import type * as api from "../../../src/api";
import type { DataStreamClient } from "../../../src/datastream";
import type { Logger } from "../../../src/logger";
import { RulesEngineClient } from "../../../src/rules-engine";
import { LeaseStore } from "../../../src/credits/lease-store";
import { ReservationStore } from "../../../src/credits/reservation-store";
import { CreditLeaseManager } from "../../../src/credits/lease-manager";
import { checkWithLease, type CreditCheckDeps } from "../../../src/credits/check";
import type { CheckResult } from "../../../src/credits/types";

const silentLogger: Logger = {
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
};

const CREDIT_ID = "credit-1";
const EVENT_SUBTYPE = "inference_tokens";

// Credit condition (camelCase — the shape the datastream cache now holds after
// the serializer canonicalizes wire payloads). `consumptionRate` 1 keeps
// credits == quantity so the math is easy to follow.
const creditCondition = {
    id: "cond-credit",
    accountId: "acct",
    environmentId: "env",
    conditionType: "credit",
    operator: "gte",
    resourceIds: [] as string[],
    traitValue: "",
    metricValue: 0,
    creditId: CREDIT_ID,
    consumptionRate: 1,
    eventSubtype: EVENT_SUBTYPE,
};

// A `company`-membership condition we can flip to force the WASM to deny the
// rule for reasons unrelated to the credit balance (so the lease reservation
// gets refunded).
function companyCondition(resourceIds: string[]) {
    return {
        id: "cond-company",
        accountId: "acct",
        environmentId: "env",
        conditionType: "company",
        operator: "eq",
        resourceIds,
        traitValue: "",
        metricValue: 0,
    };
}

function creditFlag(extraConditions: object[] = []): api.RulesengineFlag {
    return {
        id: "flag-infer",
        accountId: "acct",
        environmentId: "env",
        key: "infer",
        defaultValue: false,
        rules: [
            {
                id: "rule-credit",
                accountId: "acct",
                environmentId: "env",
                name: "Credit",
                ruleType: "plan_entitlement",
                priority: 100,
                value: true,
                conditions: [creditCondition, ...extraConditions],
                conditionGroups: [],
            },
        ],
    } as unknown as api.RulesengineFlag;
}

function company(creditBalance: number): api.RulesengineCompany {
    return {
        id: "co",
        accountId: "acct",
        environmentId: "env",
        keys: {},
        creditBalances: { [CREDIT_ID]: creditBalance },
    } as unknown as api.RulesengineCompany;
}

// Minimal datastream stub: serves a fixed flag + company from "cache" and hands
// back the REAL rules engine.
function fakeDatastream(
    engine: RulesEngineClient,
    flag: api.RulesengineFlag,
    co: api.RulesengineCompany,
): DataStreamClient {
    return {
        getFlag: async () => flag,
        getCachedCompany: async () => co,
        getCachedUser: async () => null,
        getCompany: async () => co,
        getUser: async () => null,
        getRulesEngine: () => engine,
    } as unknown as DataStreamClient;
}

function makeDeps(
    engine: RulesEngineClient,
    flag: api.RulesengineFlag,
    co: api.RulesengineCompany,
    grantedAmount: number,
): { deps: CreditCheckDeps; leaseStore: LeaseStore; reservations: ReservationStore } {
    const leaseStore = new LeaseStore();
    const reservations = new ReservationStore(leaseStore, 60_000);
    const creditsClient = {
        acquireCreditLease: jest.fn().mockResolvedValue({
            data: {
                id: "lse-1",
                companyId: "co",
                creditTypeId: CREDIT_ID,
                grantedAmount,
                expiresAt: new Date(Date.now() + 60_000),
            },
        }),
        extendCreditLease: jest.fn(),
        releaseCreditLease: jest.fn().mockResolvedValue({}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const manager = new CreditLeaseManager({
        creditsClient,
        leaseStore,
        logger: silentLogger,
        config: { defaultLeaseSize: grantedAmount, defaultLeaseDuration: 60_000 },
    });
    const deps: CreditCheckDeps = {
        leaseStore,
        reservations,
        manager,
        datastream: fakeDatastream(engine, flag, co),
        logger: silentLogger,
        enqueueFlagCheckEvent: jest.fn(),
    };
    return { deps, leaseStore, reservations };
}

const evalCtx: api.CheckFlagRequestBody = { company: { id: "co" } };
const failFallback = (): Promise<CheckResult> => {
    throw new Error("fallback should not be reached on the lease path");
};

describe("credit-lease check against the real WASM engine", () => {
    let engine: RulesEngineClient;

    beforeAll(async () => {
        engine = new RulesEngineClient();
        await engine.initialize();
    });

    it("substitutes the lease balance and lets a within-balance usage through, issuing a reservation", async () => {
        const { deps, leaseStore, reservations } = makeDeps(engine, creditFlag(), company(100), 10_000);

        const result = await checkWithLease(
            deps,
            "infer",
            evalCtx,
            { usage: 50, eventSubtype: EVENT_SUBTYPE },
            failFallback,
        );

        expect(result.allowed).toBe(true);
        expect(result.value).toBe(true);
        expect(result.reservation).toBeDefined();
        expect(result.reservation?.creditTypeId).toBe(CREDIT_ID);
        expect(result.reservation?.creditsReserved).toBe(50);
        // The 50-credit reservation stays debited from the lease's local view.
        expect((await leaseStore.get("co", CREDIT_ID))?.localRemainingCredits).toBe(9_950);
        expect(reservations.size()).toBe(1);
    });

    it("denies (and refunds the reservation) when the WASM rule fails for a non-credit reason", async () => {
        // Credit balance is plentiful, but the company-membership condition
        // excludes this company, so the WASM denies the rule. The reservation
        // taken before the eval must be returned to the lease.
        const flag = creditFlag([companyCondition(["some-other-company"])]);
        const { deps, leaseStore, reservations } = makeDeps(engine, flag, company(10_000), 10_000);

        const result = await checkWithLease(
            deps,
            "infer",
            evalCtx,
            { usage: 50, eventSubtype: EVENT_SUBTYPE },
            failFallback,
        );

        expect(result.allowed).toBe(false);
        expect(result.value).toBe(false);
        expect(result.reservation).toBeUndefined();
        // Reservation refunded: lease back to full, table empty.
        expect((await leaseStore.get("co", CREDIT_ID))?.localRemainingCredits).toBe(10_000);
        expect(reservations.size()).toBe(0);
    });

    it("cancels the reservation when the WASM allows via an override rule instead of the credit rule", async () => {
        // The company is granted the feature by a company_override rule that
        // outranks the credit-metered rule. The engine allows — but via a rule
        // that doesn't meter this credit, so the reservation taken before the
        // eval must be cancelled (no handle, nothing billed) rather than left
        // to charge credits for usage the override grants for free.
        const flag = creditFlag();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (flag.rules as any[]).unshift({
            id: "rule-override",
            accountId: "acct",
            environmentId: "env",
            name: "Override",
            ruleType: "company_override",
            priority: 1,
            value: true,
            conditions: [companyCondition(["co"])],
            conditionGroups: [],
        });
        const { deps, leaseStore, reservations } = makeDeps(engine, flag, company(100), 10_000);

        const result = await checkWithLease(
            deps,
            "infer",
            evalCtx,
            { usage: 50, eventSubtype: EVENT_SUBTYPE },
            failFallback,
        );

        expect(result.allowed).toBe(true);
        expect(result.value).toBe(true);
        expect(result.reservation).toBeUndefined();
        // The hold was refunded: lease back to full, reservation table empty.
        expect((await leaseStore.get("co", CREDIT_ID))?.localRemainingCredits).toBe(10_000);
        expect(reservations.size()).toBe(0);
    });

    it("serializes CheckFlagOptions to the snake_case event_usage envelope the WASM gates on", async () => {
        // Direct rules-engine check: prove the SDK's camelCase `eventUsage`
        // option reaches the WASM as `event_usage` and gates exactly at the
        // balance boundary. This is the contract `checkWithLease` leans on.
        const flag = creditFlag();
        const co = company(100);

        const under = await engine.checkFlagWithOptions(flag, co, null, {
            eventUsage: { eventSubtype: EVENT_SUBTYPE, quantity: 50 },
        });
        const over = await engine.checkFlagWithOptions(flag, co, null, {
            eventUsage: { eventSubtype: EVENT_SUBTYPE, quantity: 150 },
        });

        expect(under.value).toBe(true);
        expect(over.value).toBe(false);
    });
});
