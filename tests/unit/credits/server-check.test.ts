import { PaymentRequiredError } from "../../../src/api";
import { SchematicClient } from "../../../src/wrapper";

const mockCheckFlag = jest.fn();
const mockCheckAndReserveFlag = jest.fn();
const mockReleaseCreditReservation = jest.fn();
const mockAcquireCreditLease = jest.fn();
const mockExtendCreditLease = jest.fn();
const mockReleaseCreditLease = jest.fn();

jest.mock("../../../src/Client", () => {
    class MockBaseClient {
        features = {
            checkFlag: mockCheckFlag,
            checkAndReserveFlag: mockCheckAndReserveFlag,
            checkFlags: jest.fn().mockResolvedValue({ data: { flags: [] } }),
        };
        credits = {
            acquireCreditLease: mockAcquireCreditLease,
            extendCreditLease: mockExtendCreditLease,
            releaseCreditLease: mockReleaseCreditLease,
            releaseCreditReservation: mockReleaseCreditReservation,
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

// Stubbed DataStream so the `useDataStream: true` routing cases can run
// without a websocket.
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

const TTL_MS = 120_000;

const CREDIT_ENTITLEMENT = {
    featureId: "feat",
    featureKey: "inference",
    valueType: "credit",
    creditId: "bilcr_inference",
    consumptionRate: 10,
    eventSubtype: "inference_tokens",
    creditTotal: 1000,
    creditUsed: 0,
    creditRemaining: 1000,
};

function reserveResponse(overrides: Record<string, unknown> = {}) {
    return {
        data: {
            flag: "inference",
            flagId: "flag_1",
            value: true,
            reason: "matched",
            companyId: "co_1",
            userId: "user_1",
            ruleId: "rule_1",
            entitlement: CREDIT_ENTITLEMENT,
            reservation: {
                id: "rsv_1",
                companyId: "co_1",
                creditTypeId: "bilcr_inference",
                consumptionRate: 10,
                creditsReserved: 500,
                quantityReserved: 50,
                eventSubtype: "inference_tokens",
                expiresAt: new Date(Date.now() + TTL_MS),
            },
            ...overrides,
        },
        params: {},
    };
}

function makeLogger() {
    return { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
}

type ClientOpts = ConstructorParameters<typeof SchematicClient>[0];

function makeServerClient(extra: Partial<NonNullable<ClientOpts>> = {}) {
    const logger = makeLogger();
    const client = new SchematicClient({
        apiKey: "test-key",
        creditLeases: { mode: "server", defaultReservationTTL: TTL_MS },
        logger,
        ...extra,
    });
    return { client, logger };
}

// Wires the datastream + engine for the client-mode routing cases.
function configureClientModePath() {
    const flag = { id: "flag_1", key: "inference", rules: [] };
    const company = {
        id: "co_1",
        keys: { id: "co_1" },
        creditBalances: { bilcr_inference: 5000 },
        metrics: [],
        traits: [],
        rules: [],
    };
    mockDataStream.getFlag.mockResolvedValue(flag);
    mockDataStream.getCachedCompany.mockResolvedValue(company);
    mockDataStream.getCompany.mockResolvedValue(company);
    mockDataStream.getRulesEngine.mockReturnValue(mockRulesEngine);
    mockRulesEngine.checkFlagWithOptions.mockResolvedValue({
        value: true,
        reason: "matched",
        flagKey: "inference",
        flagId: "flag_1",
        entitlement: CREDIT_ENTITLEMENT,
    });
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

beforeEach(() => {
    jest.clearAllMocks();
    mockDataStream.getRulesEngine.mockReturnValue(mockRulesEngine);
    mockDataStream.isConnected.mockReturnValue(true);
    mockCheckFlag.mockResolvedValue({
        data: { flag: "inference", flagId: "flag_1", value: true, reason: "plain check" },
        params: {},
    });
    mockReleaseCreditReservation.mockResolvedValue({ data: {}, params: {} });
});

describe("client.check (server reservation path)", () => {
    it("returns a server-mode reservation handle built from the response", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(reserveResponse());
        const { client } = makeServerClient();

        const before = Date.now();
        const result = await client.check({ company: { id: "co_1" }, user: { id: "user_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });
        const after = Date.now();

        expect(result.allowed).toBe(true);
        expect(result.value).toBe(true);
        expect(result.reason).toBe("matched");
        expect(result.flagKey).toBe("inference");
        expect(result.flagId).toBe("flag_1");
        expect(result.entitlement).toEqual(CREDIT_ENTITLEMENT);

        expect(result.reservation).toBeDefined();
        expect(result.reservation?.id).toBe("rsv_1");
        // No lease exists server-side; the handle mirrors the id so the
        // required field stays populated.
        expect(result.reservation?.leaseId).toBe("rsv_1");
        expect(result.reservation?.mode).toBe("server");
        expect(result.reservation?.companyId).toBe("co_1");
        expect(result.reservation?.creditTypeId).toBe("bilcr_inference");
        expect(result.reservation?.eventSubtype).toBe("inference_tokens");
        expect(result.reservation?.quantityReserved).toBe(50);
        expect(result.reservation?.creditsReserved).toBe(500);
        expect(result.reservation?.consumptionRate).toBe(10);
        expect(result.reservation?.evalCtx).toEqual({ company: { id: "co_1" }, user: { id: "user_1" } });

        expect(mockCheckAndReserveFlag).toHaveBeenCalledTimes(1);
        const [key, body] = mockCheckAndReserveFlag.mock.calls[0];
        expect(key).toBe("inference");
        expect(body.quantity).toBe(50);
        expect(body.company).toEqual({ id: "co_1" });
        expect(body.user).toEqual({ id: "user_1" });
        expect(body.preflight).toEqual({ eventUsage: { eventSubtype: "inference_tokens", quantity: 50 } });
        const expiresAt = (body.expiresAt as Date).getTime();
        expect(expiresAt).toBeGreaterThanOrEqual(before + TTL_MS);
        expect(expiresAt).toBeLessThanOrEqual(after + TTL_MS);

        await client.close();
    });

    it("sends the generic usage preflight when no event subtype is given", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(reserveResponse());
        const { client } = makeServerClient();

        await client.check({ company: { id: "co_1" } }, "inference", { usage: 50 });

        expect(mockCheckAndReserveFlag.mock.calls[0][1].preflight).toEqual({ usage: 50 });
        await client.close();
    });

    it("threads the per-check timeout to the request options", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(reserveResponse());
        const { client } = makeServerClient();

        await client.check({ company: { id: "co_1" } }, "inference", { usage: 50, timeoutMs: 2500 });

        expect(mockCheckAndReserveFlag.mock.calls[0][2]).toEqual({ timeoutInSeconds: 2.5 });
        await client.close();
    });

    it("denies without a reservation when credits are insufficient", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(
            reserveResponse({ value: false, reason: "Insufficient credits", reservation: undefined }),
        );
        const { client } = makeServerClient();

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(false);
        expect(result.value).toBe(false);
        expect(result.reason).toBe("Insufficient credits");
        expect(result.reservation).toBeUndefined();
        // Nothing was held, so nothing to release.
        expect(mockReleaseCreditReservation).not.toHaveBeenCalled();
        await client.close();
    });

    it("allows without a reservation when the feature is not credit-metered", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(
            reserveResponse({
                reason: "company entitlement",
                reservation: undefined,
                entitlement: { featureId: "feat", featureKey: "inference", valueType: "boolean" },
            }),
        );
        const { client } = makeServerClient();

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(true);
        expect(result.value).toBe(true);
        expect(result.reservation).toBeUndefined();
        expect(result.reason).toBe("company entitlement");
        await client.close();
    });

    it("treats a 402 as a definitive denial, even with fail-open", async () => {
        mockCheckAndReserveFlag.mockRejectedValue(new PaymentRequiredError({ error: "credit balance exhausted" }));
        const { client } = makeServerClient();

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
            onAcquireFailure: "fail-open",
            defaultValue: true,
        });

        expect(result.allowed).toBe(false);
        expect(result.value).toBe(false);
        expect(result.reason).toBe("insufficient_credits");
        expect(result.err).toBe("credit balance exhausted");
        expect(result.reservation).toBeUndefined();
        await client.close();
    });

    it("fails closed when the check-and-reserve call errors", async () => {
        mockCheckAndReserveFlag.mockRejectedValue(new Error("ECONNRESET"));
        const { client } = makeServerClient();

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result.allowed).toBe(false);
        expect(result.value).toBe(false);
        expect(result.reason).toBe("server_reservation_failed");
        expect(result.err).toBe("server_reservation_failed");
        expect(result.reservation).toBeUndefined();
        await client.close();
    });

    it("fails open to the per-check defaultValue when the call errors", async () => {
        mockCheckAndReserveFlag.mockRejectedValue(new Error("ECONNRESET"));
        const { client } = makeServerClient();

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
            onAcquireFailure: "fail-open",
            defaultValue: true,
        });

        // No local engine to re-evaluate with — server mode fails open to the
        // caller's default rather than re-running the rules.
        expect(result.allowed).toBe(true);
        expect(result.value).toBe(true);
        expect(result.reason).toBe("server_reservation_failed_fail_open");
        expect(result.err).toBe("server_reservation_failed");
        await client.close();
    });

    it("fails open to the client-level flag default when no defaultValue is passed", async () => {
        mockCheckAndReserveFlag.mockRejectedValue(new Error("ECONNRESET"));
        const { client } = makeServerClient({ flagDefaults: { inference: true } });

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            onAcquireFailure: "fail-open",
        });

        expect(result.allowed).toBe(true);
        expect(result.value).toBe(true);
        expect(result.reason).toBe("server_reservation_failed_fail_open");

        // And the same client with no configured default stays denied.
        const { client: bare } = makeServerClient();
        const denied = await bare.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            onAcquireFailure: "fail-open",
        });
        expect(denied.allowed).toBe(false);

        await client.close();
        await bare.close();
    });

    it("falls back to a plain flag check when usage is 0", async () => {
        const { client } = makeServerClient();

        const result = await client.check({ company: { id: "co_1" } }, "inference", { usage: 0 });

        expect(mockCheckAndReserveFlag).not.toHaveBeenCalled();
        expect(mockCheckFlag).toHaveBeenCalledTimes(1);
        expect(result.allowed).toBe(true);
        expect(result.reason).toBe("plain check");
        expect(result.reservation).toBeUndefined();
        await client.close();
    });

    it("resolves an invalid usage through the failure contract without calling the API", async () => {
        const { client } = makeServerClient();

        const denied = await client.check({ company: { id: "co_1" } }, "inference", { usage: Number.NaN });
        expect(denied.allowed).toBe(false);
        expect(denied.reason).toBe("invalid_usage");
        expect(denied.err).toBe("invalid_usage");

        const open = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: -5,
            onAcquireFailure: "fail-open",
            defaultValue: true,
        });
        expect(open.allowed).toBe(true);
        expect(open.reason).toBe("invalid_usage_fail_open");

        expect(mockCheckAndReserveFlag).not.toHaveBeenCalled();
        expect(mockCheckFlag).not.toHaveBeenCalled();
        await client.close();
    });

    it("releases a hold that names no event subtype, since it could never settle", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(
            reserveResponse({
                reservation: {
                    id: "rsv_orphan",
                    companyId: "co_1",
                    creditTypeId: "bilcr_inference",
                    consumptionRate: 10,
                    creditsReserved: 500,
                    quantityReserved: 50,
                    expiresAt: new Date(Date.now() + TTL_MS),
                },
            }),
        );
        const { client } = makeServerClient();

        const result = await client.check({ company: { id: "co_1" } }, "inference", { usage: 50 });

        expect(mockReleaseCreditReservation).toHaveBeenCalledWith("rsv_orphan");
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe("missing_event_subtype");
        expect(result.reservation).toBeUndefined();
        await client.close();
    });
});

describe("client.trackWithReservation (server handle)", () => {
    it("settles by reservation id and never sends a lease id", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(reserveResponse());
        const { client } = makeServerClient();

        const result = await client.check({ company: { id: "co_1" }, user: { id: "user_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });
        if (!result.reservation) throw new Error("expected reservation");

        await client.trackWithReservation(result.reservation, 20);

        const pushed = mockEventBufferPush.mock.calls.find((call) => call[0]?.eventType === "track");
        expect(pushed).toBeDefined();
        expect(pushed?.[0].body.event).toBe("inference_tokens");
        expect(pushed?.[0].body.quantity).toBe(20);
        expect(pushed?.[0].body.reservationId).toBe("rsv_1");
        expect(pushed?.[0].body.leaseId).toBeUndefined();
        expect(pushed?.[0].body.company).toEqual({ id: "co_1" });
        expect(pushed?.[0].body.user).toEqual({ id: "user_1" });
        expect(pushed?.[0].idempotencyKey).toBe("lease-reservation:rsv_1");
        // Nothing local to settle — the server owns the hold.
        expect(mockReleaseCreditReservation).not.toHaveBeenCalled();
        await client.close();
    });

    it("still rejects a non-finite actualQuantity", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(reserveResponse());
        const { client } = makeServerClient();
        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });
        if (!result.reservation) throw new Error("expected reservation");

        await client.trackWithReservation(result.reservation, Number.NaN);

        expect(mockEventBufferPush.mock.calls.filter((call) => call[0]?.eventType === "track")).toHaveLength(0);
        await client.close();
    });
});

describe("credit lease mode routing", () => {
    it("auto without DataStream uses the server path", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(reserveResponse());
        const logger = makeLogger();
        const client = new SchematicClient({
            apiKey: "test-key",
            creditLeases: { mode: "auto", defaultReservationTTL: TTL_MS },
            logger,
        });

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(mockCheckAndReserveFlag).toHaveBeenCalledTimes(1);
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        expect(result.reservation?.mode).toBe("server");
        // Server mode is the documented default here, not a misconfiguration.
        expect(logger.warn).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("server mode"));
        await client.close();
    });

    it("auto with DataStream uses the client lease path", async () => {
        configureClientModePath();
        const client = new SchematicClient({
            apiKey: "test-key",
            useDataStream: true,
            creditLeases: { mode: "auto", defaultLeaseSize: 1000, sweepIntervalMs: 60_000 },
            logger: makeLogger(),
        });

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(mockCheckAndReserveFlag).not.toHaveBeenCalled();
        expect(mockAcquireCreditLease).toHaveBeenCalledTimes(1);
        expect(result.reservation?.mode).toBeUndefined();
        await client.close();
    });

    it("explicit server mode wins over an enabled DataStream", async () => {
        configureClientModePath();
        mockCheckAndReserveFlag.mockResolvedValue(reserveResponse());
        const client = new SchematicClient({
            apiKey: "test-key",
            useDataStream: true,
            creditLeases: { mode: "server", defaultReservationTTL: TTL_MS },
            logger: makeLogger(),
        });

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(mockCheckAndReserveFlag).toHaveBeenCalledTimes(1);
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        expect(result.reservation?.mode).toBe("server");
        await client.close();
    });

    it("explicit client mode without DataStream keeps the plain-check fallback and warns", async () => {
        const logger = makeLogger();
        const client = new SchematicClient({
            apiKey: "test-key",
            creditLeases: { mode: "client", sweepIntervalMs: 60_000 },
            logger,
        });

        expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("DataStream is not enabled"));

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(mockCheckAndReserveFlag).not.toHaveBeenCalled();
        expect(mockCheckFlag).toHaveBeenCalledTimes(1);
        expect(result.reservation).toBeUndefined();
        await client.close();
    });

    it("warns at construction when a client-only option is set in server mode", () => {
        const logger = makeLogger();
        const client = new SchematicClient({
            apiKey: "test-key",
            creditLeases: {
                mode: "server",
                lowWaterMark: 0.5,
                // biome-ignore lint/suspicious/noExplicitAny: a stand-in redis client is enough to trip the warning
                redisClient: {} as any,
            },
            logger,
        });

        const warning = logger.warn.mock.calls.map((call) => String(call[0])).find((m) => m.includes("only apply"));
        expect(warning).toBeDefined();
        expect(warning).toContain("lowWaterMark");
        expect(warning).toContain("redisClient");
        void client.close();
    });

    it("prewarm is a no-op in server mode", async () => {
        const { client } = makeServerClient();

        await client.identify(
            { keys: { userId: "user_1" }, company: { keys: { id: "co_1" } } },
            { prewarm: ["bilcr_inference"] },
        );
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        await client.close();
    });
});
