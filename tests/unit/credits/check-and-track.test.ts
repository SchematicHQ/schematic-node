import { SchematicClient } from "../../../src/wrapper";

const mockCheckFlag = jest.fn();
const mockAcquireCreditLease = jest.fn();
const mockExtendCreditLease = jest.fn();
const mockReleaseCreditLease = jest.fn();

jest.mock("../../../src/Client", () => {
    class MockBaseClient {
        features = {
            checkFlag: mockCheckFlag,
            checkFlags: jest.fn().mockResolvedValue({ data: { flags: [] } }),
        };
        credits = {
            acquireCreditLease: mockAcquireCreditLease,
            extendCreditLease: mockExtendCreditLease,
            releaseCreditLease: mockReleaseCreditLease,
        };
        events = {};
    }
    return { SchematicClient: MockBaseClient };
});

const mockEventBufferPush = jest.fn();
jest.mock("../../../src/events", () => ({
    EventBuffer: jest.fn().mockImplementation(() => ({
        push: mockEventBufferPush,
        flush: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
    })),
}));

// Stub DataStreamClient to a fixed shape — we manually wire its methods so
// the lease path has everything it needs without spinning up a websocket.
const mockDataStream = {
    start: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    checkFlag: jest.fn(),
    updateCompanyMetrics: jest.fn().mockResolvedValue(undefined),
    getFlag: jest.fn(),
    getCachedCompany: jest.fn(),
    getCompany: jest.fn(),
    getCachedUser: jest.fn().mockResolvedValue(null),
    getUser: jest.fn(),
    getRulesEngine: jest.fn(),
};

jest.mock("../../../src/datastream", () => ({
    DataStreamClient: jest.fn().mockImplementation(() => mockDataStream),
}));

// Stub rules engine
const mockRulesEngine = {
    initialize: jest.fn().mockResolvedValue(undefined),
    isInitialized: jest.fn().mockReturnValue(true),
    checkFlag: jest.fn(),
    checkFlagWithOptions: jest.fn(),
    getVersionKey: jest.fn().mockReturnValue("1"),
};
jest.mock("../../../src/rules-engine", () => ({
    RulesEngineClient: jest.fn().mockImplementation(() => mockRulesEngine),
}));

mockDataStream.getRulesEngine.mockReturnValue(mockRulesEngine);

const flag = {
    accountId: "acct",
    defaultValue: false,
    environmentId: "env",
    id: "flag_1",
    key: "inference",
    rules: [
        {
            accountId: "acct",
            conditionGroups: [],
            conditions: [
                {
                    accountId: "acct",
                    conditionType: "credit",
                    consumptionRate: 10,
                    creditId: "bilcr_inference",
                    environmentId: "env",
                    eventSubtype: "inference_tokens",
                    id: "cond_1",
                    operator: "gte",
                    resourceIds: [],
                    traitValue: "0",
                },
            ],
            environmentId: "env",
            id: "rule_1",
            name: "credit gate",
            priority: 1,
            ruleType: "standard",
            value: true,
        },
    ],
};

// Build a single-condition credit rule for a given credit type. Used to
// assemble flags that meter one feature across multiple credit types.
function makeCreditRule(id: string, creditId: string, consumptionRate: number) {
    return {
        accountId: "acct",
        conditionGroups: [],
        conditions: [
            {
                accountId: "acct",
                conditionType: "credit",
                consumptionRate,
                creditId,
                environmentId: "env",
                eventSubtype: "inference_tokens",
                id: `cond_${creditId}`,
                operator: "gte",
                resourceIds: [],
                traitValue: "0",
            },
        ],
        environmentId: "env",
        id,
        name: id,
        priority: 1,
        ruleType: "standard",
        value: true,
    };
}

const company = {
    id: "co_1",
    accountId: "acct",
    environmentId: "env",
    keys: { id: "co_1" },
    metrics: [],
    creditBalances: { bilcr_inference: 5000 },
    planIds: [],
    planVersionIds: [],
    billingProductIds: [],
    subscription: null,
    traits: [],
    rules: [],
};

function configureSuccessfulAcquire() {
    mockAcquireCreditLease.mockResolvedValue({
        data: {
            id: "lse_1",
            companyId: "co_1",
            creditTypeId: "bilcr_inference",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 5 * 60_000),
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        params: {},
    });
}

function configureFailingAcquire() {
    mockAcquireCreditLease.mockRejectedValue(new Error("lease 503"));
}

function configureDataStream() {
    mockDataStream.getFlag.mockResolvedValue(flag);
    mockDataStream.getCachedCompany.mockResolvedValue(company);
    // The lease path resolves entities like a plain datastream check does:
    // cache-first with a live WS fetch behind it (`getCompany`/`getUser`).
    mockDataStream.getCompany.mockResolvedValue(company);
}

function makeClient() {
    return new SchematicClient({
        apiKey: "test-key",
        useDataStream: true,
        creditLeases: {
            defaultLeaseDuration: 5 * 60_000,
            defaultReservationTTL: 60_000,
            defaultLeaseSize: 1000,
            lowWaterMark: 0.25,
            sweepIntervalMs: 60_000,
        },
        logger: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        },
    });
}

beforeEach(() => {
    jest.clearAllMocks();
    mockDataStream.getRulesEngine.mockReturnValue(mockRulesEngine);
    mockDataStream.isConnected.mockReturnValue(true);
});

describe("client.check (lease path)", () => {
    it("issues a reservation when the engine says allowed", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
            entitlement: {
                featureId: "feat",
                featureKey: "inference",
                valueType: "credit_burndown",
                creditId: "bilcr_inference",
                creditTotal: 1000,
                creditUsed: 0,
                creditRemaining: 1000,
            },
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeDefined();
        expect(result.reservation?.creditsReserved).toBe(500);
        expect(result.reservation?.consumptionRate).toBe(10);
        expect(result.reservation?.quantityReserved).toBe(50);
        expect(mockAcquireCreditLease).toHaveBeenCalledTimes(1);
        // Substituted balance flows into WASM: pre-reservation localRemaining = 1000.
        const callArgs = mockRulesEngine.checkFlagWithOptions.mock.calls[0];
        expect(callArgs[1].creditBalances.bilcr_inference).toBe(1000);
        expect(callArgs[3]).toEqual({ eventUsage: { eventSubtype: "inference_tokens", quantity: 50 } });
        await client.close();
    });

    it("leases the credit the company's matched plan uses when a flag mixes credit types", async () => {
        // `inference` is entitled via two plans: a legacy USD-cents credit
        // (declared first on the flag) and an AI-credits credit. The company is
        // on the AI-credits plan, so the lease must target AI credits even
        // though the USD condition appears first. The engine probe reports the
        // matched plan's credit; we lease that, not the first-declared one.
        const mixedCreditFlag = {
            ...flag,
            rules: [makeCreditRule("rule_usd", "bilcr_usd", 10), makeCreditRule("rule_ai", "bilcr_ai", 5)],
        };
        mockDataStream.getFlag.mockResolvedValue(mixedCreditFlag);
        const mixedCompany = {
            ...company,
            creditBalances: { bilcr_usd: 0, bilcr_ai: 5000 },
        };
        mockDataStream.getCachedCompany.mockResolvedValue(mixedCompany);
        mockDataStream.getCompany.mockResolvedValue(mixedCompany);
        mockAcquireCreditLease.mockResolvedValue({
            data: {
                id: "lse_ai",
                companyId: "co_1",
                creditTypeId: "bilcr_ai",
                grantedAmount: 1000,
                expiresAt: new Date(Date.now() + 5 * 60_000),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            params: {},
        });
        // Probe + final eval both report the matched plan's credit (AI credits).
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched ai plan",
            flagKey: "inference",
            flagId: "flag_1",
            entitlement: {
                featureId: "feat",
                featureKey: "inference",
                valueType: "credit_burndown",
                creditId: "bilcr_ai",
                creditRemaining: 5000,
            },
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(true);
        // Leased AI credits (the matched plan), not the first-declared USD credit.
        expect(result.reservation?.creditTypeId).toBe("bilcr_ai");
        expect(result.reservation?.consumptionRate).toBe(5);
        expect(result.reservation?.creditsReserved).toBe(250);
        expect(mockAcquireCreditLease).toHaveBeenCalledTimes(1);
        expect(mockAcquireCreditLease.mock.calls[0][0].creditTypeId).toBe("bilcr_ai");
        // One probe eval (raw balance) + one gating eval (substituted balance).
        expect(mockRulesEngine.checkFlagWithOptions).toHaveBeenCalledTimes(2);
        await client.close();
    });

    it("cancels the reservation when the allow comes from a different (non-credit) rule", async () => {
        // The company is granted the feature by an override rule, not the
        // credit-metered rule we reserved against. Billing the reservation
        // would charge credits for usage the override grants for free — the
        // hold must be cancelled and the allow returned without a handle.
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValueOnce({
            value: true,
            reason: "company override",
            flagKey: "inference",
            flagId: "flag_1",
            ruleId: "rule_override",
            ruleType: "company_override",
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(true);
        expect(result.value).toBe(true);
        expect(result.reservation).toBeUndefined();

        // The cancelled hold was refunded: a follow-up check that DOES match
        // the credit rule sees the full lease balance (1000, not 1000-500)
        // substituted into its evaluation.
        mockRulesEngine.checkFlagWithOptions.mockResolvedValueOnce({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
            ruleId: "rule_1",
        });
        const second = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });
        expect(second.reservation?.creditsReserved).toBe(500);
        const secondCallArgs = mockRulesEngine.checkFlagWithOptions.mock.calls[1];
        expect(secondCallArgs[1].creditBalances.bilcr_inference).toBe(1000);
        await client.close();
    });

    it("keeps the reservation when the engine reports the credit rule's ruleId", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
            ruleId: "rule_1",
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeDefined();
        await client.close();
    });

    it("returns allowed=false and refunds reservation when engine denies", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: false,
            reason: "denied",
            flagKey: "inference",
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(false);
        expect(result.reservation).toBeUndefined();
        await client.close();
    });

    it("fails closed when lease acquire errors and onAcquireFailure='fail-closed'", async () => {
        configureFailingAcquire();
        configureDataStream();

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
            onAcquireFailure: "fail-closed",
        });

        expect(result.allowed).toBe(false);
        expect(result.reservation).toBeUndefined();
        expect(mockRulesEngine.checkFlagWithOptions).not.toHaveBeenCalled();
        await client.close();
    });

    it("defaults to fail-closed when onAcquireFailure is not specified", async () => {
        configureFailingAcquire();
        configureDataStream();

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(false);
        expect(result.reservation).toBeUndefined();
        expect(mockRulesEngine.checkFlagWithOptions).not.toHaveBeenCalled();
        await client.close();
    });

    it("respects explicit fail-open override on acquire failure, still evaluating the rules", async () => {
        configureFailingAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
            onAcquireFailure: "fail-open",
        });

        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeUndefined();
        expect(result.err).toBe("lease_acquire_failed");
        // Fail-open still runs the engine — with the credit balance substituted
        // to an effectively unlimited value so only the credit gate is bypassed.
        expect(mockRulesEngine.checkFlagWithOptions).toHaveBeenCalledTimes(1);
        const callArgs = mockRulesEngine.checkFlagWithOptions.mock.calls[0];
        expect(callArgs[1].creditBalances.bilcr_inference).toBe(Number.MAX_SAFE_INTEGER);
        expect(callArgs[3]).toEqual({ eventUsage: { eventSubtype: "inference_tokens", quantity: 50 } });
        await client.close();
    });

    it("fail-open still denies a company the rules do not entitle", async () => {
        configureFailingAcquire();
        configureDataStream();
        // The engine denies for a non-credit reason (e.g. no matching plan rule)
        // even with the substituted unlimited balance.
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: false,
            reason: "no matching rule",
            flagKey: "inference",
            flagId: "flag_1",
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
            onAcquireFailure: "fail-open",
        });

        expect(result.allowed).toBe(false);
        expect(result.reservation).toBeUndefined();
        expect(result.err).toBe("lease_acquire_failed");
        await client.close();
    });

    it("fail-open falls back to a blanket allow when the fail-open evaluation itself errors", async () => {
        configureFailingAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockRejectedValue(new Error("wasm exploded"));

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
            onAcquireFailure: "fail-open",
        });

        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeUndefined();
        await client.close();
    });

    it("falls back to plain check when no preflight options are provided", async () => {
        configureDataStream();
        mockCheckFlag.mockResolvedValue({
            data: { value: true, flag: "inference", reason: "match" },
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference");

        expect(result.allowed).toBe(true);
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        await client.close();
    });

    it("threads preflight through the fallback when the lease path can't run", async () => {
        configureDataStream();
        // No cached flag → the lease path falls back to a plain check.
        mockDataStream.getFlag.mockResolvedValue(null);
        mockDataStream.checkFlag.mockResolvedValue({ value: true, reason: "match", flagKey: "inference" });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 25,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeUndefined();
        // The plain check still gates on the post-call balance: the preflight
        // rides along as eventUsage into the client-side evaluation instead of
        // being silently dropped.
        expect(mockDataStream.checkFlag).toHaveBeenCalledWith(
            { company: { id: "co_1" } },
            "inference",
            expect.objectContaining({
                eventUsage: { eventSubtype: "inference_tokens", quantity: 25 },
            }),
        );
        await client.close();
    });

    it("short-circuits usage 0 to a plain check with no lease and no reservation", async () => {
        // Zero usage means nothing to reserve — a 0-credit hold would be a pure
        // no-op handle. The plain check still runs with the preflight threaded
        // (usage: 0), so every rule evaluates normally.
        configureSuccessfulAcquire();
        configureDataStream();
        mockDataStream.checkFlag.mockResolvedValue({ value: true, reason: "match", flagKey: "inference" });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 0,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeUndefined();
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        expect(mockDataStream.checkFlag).toHaveBeenCalledWith(
            { company: { id: "co_1" } },
            "inference",
            expect.objectContaining({
                eventUsage: { eventSubtype: "inference_tokens", quantity: 0 },
            }),
        );
        await client.close();
    });

    it("threads preflight through a plain check when creditLeases is not configured", async () => {
        mockDataStream.checkFlag.mockResolvedValue({ value: true, reason: "match", flagKey: "inference" });

        const client = new SchematicClient({
            apiKey: "test-key",
            useDataStream: true,
            logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        });
        // No eventSubtype: the quantity goes out as the generic `usage` knob.
        const result = await client.check({ company: { id: "co_1" } }, "inference", { usage: 25 });

        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeUndefined();
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        expect(mockDataStream.checkFlag).toHaveBeenCalledWith(
            { company: { id: "co_1" } },
            "inference",
            expect.objectContaining({ usage: 25 }),
        );
        await client.close();
    });

    it("falls back when neither the caller nor the condition supplies an event subtype", async () => {
        // The reservation settles into a Track event named by the subtype; an
        // empty event name would consume the reservation while billing
        // nothing, so the lease path must decline to reserve.
        configureSuccessfulAcquire();
        configureDataStream();
        const noSubtypeFlag = {
            ...flag,
            rules: [
                {
                    ...flag.rules[0],
                    conditions: [{ ...flag.rules[0].conditions[0], eventSubtype: undefined }],
                },
            ],
        };
        mockDataStream.getFlag.mockResolvedValue(noSubtypeFlag);
        mockDataStream.checkFlag.mockResolvedValue({ value: true, reason: "match", flagKey: "inference" });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", { usage: 50 });

        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeUndefined();
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        // The plain check still carries the usage preflight.
        expect(mockDataStream.checkFlag).toHaveBeenCalledWith(
            { company: { id: "co_1" } },
            "inference",
            expect.objectContaining({ usage: 50 }),
        );
        await client.close();
    });

    it("rejects NaN usage via the failure contract without touching the lease", async () => {
        // Regression: an unguarded NaN debit poisons the lease balance into
        // approving every subsequent reserve (`NaN < x` is always false).
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
        });

        const client = makeClient();
        const denied = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: Number.NaN,
            eventSubtype: "inference_tokens",
        });
        expect(denied.allowed).toBe(false);
        expect(denied.err).toBe("invalid_usage");
        expect(denied.reservation).toBeUndefined();
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();

        // The lease path still gates correctly after the bad input: a valid
        // check reserves against an unpoisoned balance.
        const allowed = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });
        expect(allowed.allowed).toBe(true);
        expect(allowed.reservation?.creditsReserved).toBe(500);
        await client.close();
    });

    it("resolves invalid usage through fail-open when configured", async () => {
        configureSuccessfulAcquire();
        configureDataStream();

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: -10,
            eventSubtype: "inference_tokens",
            onAcquireFailure: "fail-open",
        });
        expect(result.allowed).toBe(true);
        expect(result.err).toBe("invalid_usage");
        expect(result.reservation).toBeUndefined();
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        await client.close();
    });
});

describe("flag_check event reporting on the lease path", () => {
    // Every lease-path resolution must enqueue a flag_check event, mirroring
    // the plain checkFlag paths — otherwise lease-gated checks go dark in
    // flag-check analytics and company last-seen.
    function pushedFlagChecks() {
        return mockEventBufferPush.mock.calls
            .map((call) => call[0])
            .filter((event) => event?.eventType === "flag_check");
    }

    it("enqueues a flag_check event when the engine allows", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
            ruleId: "rule_1",
            companyId: "co_1",
        });

        const client = makeClient();
        await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        const events = pushedFlagChecks();
        expect(events).toHaveLength(1);
        expect(events[0].body).toMatchObject({
            flagKey: "inference",
            value: true,
            reason: "matched",
            flagId: "flag_1",
            ruleId: "rule_1",
            companyId: "co_1",
            reqCompany: { id: "co_1" },
        });
        await client.close();
    });

    it("enqueues a flag_check event when the engine denies", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: false,
            reason: "denied",
            flagKey: "inference",
        });

        const client = makeClient();
        await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        const events = pushedFlagChecks();
        expect(events).toHaveLength(1);
        expect(events[0].body).toMatchObject({
            flagKey: "inference",
            value: false,
            reason: "denied",
            companyId: "co_1",
        });
        await client.close();
    });

    it("enqueues a flag_check event on a fail-closed acquire failure", async () => {
        configureFailingAcquire();
        configureDataStream();

        const client = makeClient();
        await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
            onAcquireFailure: "fail-closed",
        });

        const events = pushedFlagChecks();
        expect(events).toHaveLength(1);
        expect(events[0].body).toMatchObject({
            flagKey: "inference",
            value: false,
            reason: "lease_acquire_failed",
            error: "lease_acquire_failed",
            companyId: "co_1",
        });
        await client.close();
    });

    it("enqueues exactly one flag_check event when the lease path delegates to the fallback", async () => {
        // No cached flag → checkWithLease falls back to the plain check, which
        // enqueues its own flag_check; the lease path must not add a second.
        configureDataStream();
        mockDataStream.getFlag.mockResolvedValue(null);
        mockDataStream.checkFlag.mockResolvedValue({
            value: true,
            reason: "fallback",
            flagKey: "inference",
        });

        const client = makeClient();
        await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(pushedFlagChecks()).toHaveLength(1);
        await client.close();
    });
});

describe("client.prewarm (datastream resolution)", () => {
    it("actively fetches a not-yet-cached company over the datastream before acquiring", async () => {
        configureSuccessfulAcquire();
        mockDataStream.getFlag.mockResolvedValue(flag);
        // Not cached yet. prewarm actively fetches via getCompany (identify
        // doesn't push the company into the cache on its own). Reject once to
        // exercise the WS-connecting retry, then surface the company.
        mockDataStream.getCachedCompany.mockResolvedValue(null);
        mockDataStream.getCompany
            .mockRejectedValueOnce(new Error("DataStream client is not connected"))
            .mockResolvedValue(company);

        const client = makeClient();
        await client.prewarm({ company: { external_id: "ext-co-1" } }, ["bilcr_inference"]);

        expect(mockDataStream.getCompany).toHaveBeenCalledWith({ external_id: "ext-co-1" });
        expect(mockAcquireCreditLease).toHaveBeenCalledTimes(1);
        expect(mockAcquireCreditLease).toHaveBeenCalledWith(
            expect.objectContaining({ companyId: "co_1", creditTypeId: "bilcr_inference" }),
            undefined,
        );
        await client.close();
    });

    it("gives up after prewarmResolveTimeoutMs without acquiring", async () => {
        configureSuccessfulAcquire();
        mockDataStream.getFlag.mockResolvedValue(flag);
        mockDataStream.getCachedCompany.mockResolvedValue(null);
        // Company never surfaces over the datastream.
        mockDataStream.getCompany.mockRejectedValue(new Error("DataStream client is not connected"));

        const client = new SchematicClient({
            apiKey: "test-key",
            useDataStream: true,
            creditLeases: {
                defaultLeaseSize: 1000,
                sweepIntervalMs: 60_000,
                prewarmResolveTimeoutMs: 250,
            },
            logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        });
        await client.prewarm({ company: { external_id: "ext-co-missing" } }, ["bilcr_inference"]);

        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        await client.close();
    });
});

describe("client.trackWithReservation", () => {
    it("refunds unused credits and emits a Track event with actual quantity", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
        });

        const client = makeClient();
        const res = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });
        if (!res.reservation) throw new Error("expected reservation");

        // Local balance after reservation: 1000 - 500 = 500
        await client.trackWithReservation(res.reservation, 20);

        // Track event was enqueued with actualQuantity
        const pushed = mockEventBufferPush.mock.calls.find((call) => call[0]?.eventType === "track");
        expect(pushed).toBeDefined();
        expect(pushed?.[0].body.event).toBe("inference_tokens");
        expect(pushed?.[0].body.quantity).toBe(20);
        expect(pushed?.[0].body.company).toEqual({ id: "co_1" });
        await client.close();
    });

    it("emits a recovery Track keyed for idempotent dedupe when the reservation is gone before track", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        const client = new SchematicClient({
            apiKey: "test-key",
            useDataStream: true,
            creditLeases: { defaultLeaseSize: 1000, sweepIntervalMs: 60_000 },
            logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        });
        const reservation = {
            id: "missing",
            leaseId: "lse_x",
            companyId: "co_1",
            creditTypeId: "bilcr_inference",
            eventSubtype: "inference_tokens",
            quantityReserved: 10,
            creditsReserved: 100,
            consumptionRate: 10,
            expiresAt: new Date(Date.now() + 60_000),
            evalCtx: { company: { id: "co_1" } },
        };

        // Reservation is gone from the store (swept after TTL), but the work
        // completed — we still owe the server a Track so the usage is billed.
        await client.trackWithReservation(reservation, 5);
        const trackCalls = () => mockEventBufferPush.mock.calls.filter((call) => call[0]?.eventType === "track");
        expect(trackCalls()).toHaveLength(1);
        const recovery = trackCalls()[0][0];
        expect(recovery.body.event).toBe("inference_tokens");
        expect(recovery.body.quantity).toBe(5);
        expect(recovery.body.leaseId).toBe("lse_x");
        // The Track carries a deterministic idempotency key derived from the
        // reservation id, so the server dedupes duplicate/recovery emits.
        expect(recovery.idempotencyKey).toBe("lease-reservation:missing");

        // A second call re-emits with the SAME key — the SDK relies on the
        // server's (account, env, event_type, key) dedupe to collapse them to
        // one billed event, rather than suppressing client-side (which wouldn't
        // hold across pods or restarts).
        await client.trackWithReservation(reservation, 5);
        const calls = trackCalls();
        expect(calls).toHaveLength(2);
        expect(calls[1][0].idempotencyKey).toBe("lease-reservation:missing");
        await client.close();
    });

    it("keys the normal settle Track with the reservation id too", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
        });
        const client = makeClient();
        const res = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });
        if (!res.reservation) throw new Error("expected reservation");

        await client.trackWithReservation(res.reservation, 20);
        const pushed = mockEventBufferPush.mock.calls.find((call) => call[0]?.eventType === "track");
        expect(pushed?.[0].idempotencyKey).toBe(`lease-reservation:${res.reservation.id}`);
        await client.close();
    });

    it("rejects a non-finite or negative actualQuantity without touching the store or billing", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
        });
        const client = makeClient();
        const res = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });
        if (!res.reservation) throw new Error("expected reservation");

        // Mirrors the check-path usage guard: a NaN settle would claim the
        // reservation with no refund and serialize `quantity: null` into the
        // billing event; negative would bill negative usage.
        for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -5]) {
            await client.trackWithReservation(res.reservation, bad);
        }
        expect(mockEventBufferPush.mock.calls.filter((call) => call[0]?.eventType === "track")).toHaveLength(0);

        // The reservation was left untouched — a later valid settle still
        // claims it and bills normally.
        await client.trackWithReservation(res.reservation, 20);
        const pushed2 = mockEventBufferPush.mock.calls.find((call) => call[0]?.eventType === "track");
        expect(pushed2?.[0].body.quantity).toBe(20);
        await client.close();
    });
});

describe("evalCtx user resolution on the lease path", () => {
    const user = {
        id: "user_1",
        accountId: "acct",
        environmentId: "env",
        keys: { id: "user_1" },
        traits: [],
        rules: [],
    };

    it("fetches the user over the datastream and evaluates with it", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockDataStream.getUser.mockResolvedValue(user);
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" }, user: { id: "user_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(true);
        expect(mockDataStream.getUser).toHaveBeenCalledWith({ id: "user_1" });
        // The resolved user is threaded into the gating eval — user-targeted
        // rules and overrides apply on the lease path.
        const callArgs = mockRulesEngine.checkFlagWithOptions.mock.calls[0];
        expect(callArgs[2]).toBe(user);
        await client.close();
    });

    it("falls back to a plain check when the user cannot be resolved", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockDataStream.getUser.mockRejectedValue(new Error("DataStream client is not connected"));
        mockDataStream.checkFlag.mockResolvedValue({
            value: true,
            reason: "fallback",
            flagKey: "inference",
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" }, user: { id: "user_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        // Evaluating with a silently-dropped user could mis-gate — fall back
        // to the plain check instead, which never reserves.
        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeUndefined();
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        await client.close();
    });

    it("falls back to a plain check when the company cannot be resolved", async () => {
        configureSuccessfulAcquire();
        mockDataStream.getFlag.mockResolvedValue(flag);
        mockDataStream.getCompany.mockRejectedValue(new Error("DataStream client is not connected"));
        mockDataStream.checkFlag.mockResolvedValue({
            value: true,
            reason: "fallback",
            flagKey: "inference",
        });

        const client = makeClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeUndefined();
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        await client.close();
    });
});

describe("store-failure containment (unreachable Redis backend)", () => {
    function makeBrokenRedis() {
        const err = new Error("redis down");
        const reject = () => Promise.reject(err);
        return {
            get: reject,
            set: reject,
            setEx: reject,
            del: reject,
            // eslint-disable-next-line require-yield
            scanIterator: async function* () {
                throw err;
            },
            hSet: reject,
            hGet: reject,
            hGetAll: reject,
            hDel: reject,
            zAdd: reject,
            zRangeByScore: reject,
            zRem: reject,
            zCard: reject,
            eval: reject,
            pExpireAt: reject,
            // biome-ignore lint/suspicious/noExplicitAny: test stub
        } as any;
    }

    function makeRedisBackedClient() {
        return new SchematicClient({
            apiKey: "test-key",
            useDataStream: true,
            creditLeases: {
                defaultLeaseSize: 1000,
                sweepIntervalMs: 60_000,
                redisClient: makeBrokenRedis(),
            },
            logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        });
    }

    it("check() resolves fail-closed instead of rejecting when the store is down", async () => {
        configureSuccessfulAcquire();
        configureDataStream();

        const client = makeRedisBackedClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(false);
        expect(result.reservation).toBeUndefined();
        expect(result.err).toBeDefined();
        await client.close();
    });

    it("check() honors fail-open (rules still evaluated) when the store is down", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
        });

        const client = makeRedisBackedClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
            onAcquireFailure: "fail-open",
        });

        expect(result.allowed).toBe(true);
        expect(result.reservation).toBeUndefined();
        const callArgs = mockRulesEngine.checkFlagWithOptions.mock.calls[0];
        expect(callArgs[1].creditBalances.bilcr_inference).toBe(Number.MAX_SAFE_INTEGER);
        await client.close();
    });

    it("trackWithReservation still emits the billing Track when the local settle fails", async () => {
        configureDataStream();
        const client = makeRedisBackedClient();
        const reservation = {
            id: "res_orphan",
            leaseId: "lse_x",
            companyId: "co_1",
            creditTypeId: "bilcr_inference",
            eventSubtype: "inference_tokens",
            quantityReserved: 10,
            creditsReserved: 100,
            consumptionRate: 10,
            expiresAt: new Date(Date.now() + 60_000),
            evalCtx: { company: { id: "co_1" } },
        };

        // Must not throw, and must still bill the usage.
        await client.trackWithReservation(reservation, 7);

        const pushed = mockEventBufferPush.mock.calls.find((call) => call[0]?.eventType === "track");
        expect(pushed).toBeDefined();
        expect(pushed?.[0].body.quantity).toBe(7);
        expect(pushed?.[0].body.leaseId).toBe("lse_x");
        expect(pushed?.[0].idempotencyKey).toBe("lease-reservation:res_orphan");
        await client.close();
    });
});

describe("close() lease release", () => {
    it("releases this process's leases on close with the in-memory backend", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockReleaseCreditLease.mockResolvedValue({});
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
        });

        const client = makeClient();
        await client.check({ company: { id: "co_1" } }, "inference", { usage: 50, eventSubtype: "inference_tokens" });
        expect(mockReleaseCreditLease).not.toHaveBeenCalled();

        await client.close();
        // The in-memory store is exclusively this process's — releasing returns
        // the unspent remainder to the company balance immediately.
        expect(mockReleaseCreditLease).toHaveBeenCalledWith("lse_1", {});
    });
});

describe("per-check timeout threading", () => {
    it("threads timeoutMs to the lease acquire wire call", async () => {
        configureSuccessfulAcquire();
        configureDataStream();
        mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
        });

        const client = makeClient();
        await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
            timeoutMs: 2000,
        });

        expect(mockAcquireCreditLease).toHaveBeenCalledWith(expect.objectContaining({ companyId: "co_1" }), {
            timeoutInSeconds: 2,
        });
        await client.close();
    });
});

describe("checkFlag preflight forwarding", () => {
    it("forwards preflight options to the datastream evaluation", async () => {
        configureDataStream();
        mockDataStream.checkFlag.mockResolvedValue({
            value: true,
            reason: "matched",
            flagKey: "inference",
            flagId: "flag_1",
        });

        const client = makeClient();
        // Plain checkFlag with preflight knobs: no lease, no reservation — the
        // options must still reach the local WASM evaluation (dry-run gate).
        const options = {
            usage: 5,
            eventUsage: { eventSubtype: "inference_tokens", quantity: 5 },
            creditCost: { bilcr_inference: 50 },
        };
        await client.checkFlag({ company: { id: "co_1" } }, "inference", options);

        expect(mockDataStream.checkFlag).toHaveBeenCalledWith({ company: { id: "co_1" } }, "inference", options);
        await client.close();
    });
});
