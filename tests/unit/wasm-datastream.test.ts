/**
 * WASM <-> DataStream Integration Tests
 *
 * Unlike wasm-integration.test.ts (which feeds hand-written fixtures directly
 * to the engine), these tests exercise the full datastream path against the
 * REAL WASM rules engine: snake_case wire messages are ingested by the
 * DataStreamClient (canonicalized to camelCase via the Fern serializers),
 * partials are merged, and flag checks evaluate the cached entities in WASM.
 *
 * This is the seam where casing bugs live: the engine accepts either casing
 * per field (serde aliases), but rejects an object carrying BOTH casings of
 * the same field ("duplicate field"), so the cache must stay single-shape.
 *
 * Only the WebSocket transport is mocked; the rules engine is real.
 */
import { DataStreamClient, DataStreamClientOptions } from "../../src/datastream/datastream-client";
import { DatastreamWSClient } from "../../src/datastream/websocket-client";
import { DataStreamResp, EntityType, MessageType } from "../../src/datastream/types";
import { Logger } from "../../src/logger";

const mockWS = {
    on: jest.fn(),
    start: jest.fn(),
    close: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    isReady: jest.fn().mockReturnValue(true),
    sendMessage: jest.fn().mockResolvedValue(undefined),
};
jest.mock("../../src/datastream/websocket-client", () => ({
    DatastreamWSClient: jest.fn().mockImplementation(() => mockWS),
}));

// A metric-gated flag in wire format: true once the company has >= 5
// "api_call" events (all_time). Multi-word fields (event_subtype,
// metric_period, metric_value) make evaluation casing-sensitive.
const wireMetricFlag = {
    id: "flag-metric",
    account_id: "account-123",
    environment_id: "env-123",
    key: "metric-flag",
    default_value: false,
    rules: [
        {
            id: "rule-metric",
            account_id: "account-123",
            environment_id: "env-123",
            name: "Usage gate",
            rule_type: "standard",
            priority: 100,
            value: true,
            conditions: [
                {
                    id: "cond-metric",
                    account_id: "account-123",
                    environment_id: "env-123",
                    condition_type: "metric",
                    operator: "gte",
                    resource_ids: [],
                    event_subtype: "api_call",
                    metric_period: "all_time",
                    metric_value: 5,
                    trait_value: "",
                },
            ],
            condition_groups: [],
        },
    ],
};

// An unconditional standard rule: evaluates true unless the engine errors,
// in which case checkFlag falls back to default_value (false).
const wireAlwaysOnFlag = {
    id: "flag-on",
    account_id: "account-123",
    environment_id: "env-123",
    key: "always-on",
    default_value: false,
    rules: [
        {
            id: "rule-on",
            account_id: "account-123",
            environment_id: "env-123",
            name: "Always On",
            rule_type: "standard",
            priority: 100,
            value: true,
            conditions: [],
            condition_groups: [],
        },
    ],
};

const wireMetric = (value: number) => ({
    account_id: "account-123",
    environment_id: "env-123",
    company_id: "company-1",
    event_subtype: "api_call",
    period: "all_time",
    month_reset: "first_of_month",
    value,
    created_at: "2026-01-01T00:00:00Z",
});

const wireCompany = (metricValue: number) => ({
    id: "company-1",
    account_id: "account-123",
    environment_id: "env-123",
    keys: { name: "Wire Corp" },
    base_plan_id: null,
    billing_product_ids: [],
    plan_ids: [],
    plan_version_ids: [],
    credit_balances: { "credit-1": 100.0 },
    metrics: [wireMetric(metricValue)],
    traits: [],
    rules: [],
    entitlements: [
        {
            feature_id: "feat-1",
            feature_key: "feature-one",
            value_type: "credit",
            credit_id: "credit-1",
            credit_total: 200.0,
            credit_used: 100.0,
            credit_remaining: 100.0,
        },
    ],
});

describe("WASM <-> DataStream integration (real engine)", () => {
    let client: DataStreamClient;
    let messageHandler: (message: DataStreamResp) => Promise<void>;
    let logger: Logger;

    beforeEach(async () => {
        jest.clearAllMocks();
        mockWS.sendMessage.mockResolvedValue(undefined);
        logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
        const options: DataStreamClientOptions = {
            apiKey: "test-api-key",
            baseURL: "https://api.schematichq.com",
            logger,
        };
        client = new DataStreamClient(options);
        await client.start();
        const WSMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
        messageHandler = WSMock.mock.calls[0][0].messageHandler;
    });

    afterEach(async () => {
        client.removeAllListeners();
        client.close();
        await new Promise((resolve) => setImmediate(resolve));
    });

    const sendFullCompany = (metricValue: number) =>
        messageHandler({
            entity_type: EntityType.COMPANY,
            message_type: MessageType.FULL,
            data: wireCompany(metricValue),
        } as DataStreamResp);

    const sendFlags = () =>
        messageHandler({
            entity_type: EntityType.FLAGS,
            message_type: MessageType.FULL,
            data: [wireMetricFlag, wireAlwaysOnFlag],
        } as DataStreamResp);

    const check = (flagKey: string) => client.checkFlag({ company: { name: "Wire Corp" } }, flagKey);

    test("FULL snake_case wire message -> canonicalized cache -> engine evaluates the metric gate", async () => {
        await sendFullCompany(10);
        await sendFlags();

        const result = await check("metric-flag");
        expect(result.reason).not.toBe("RULES_ENGINE_ERROR");
        expect(result.reason).not.toBe("RULES_ENGINE_UNAVAILABLE");
        expect(result.value).toBe(true);

        // The cache holds the canonical camelCase shape.
        const cached = await client.getCompany({ name: "Wire Corp" });
        expect((cached as any).accountId).toBe("account-123");
        expect((cached as any).account_id).toBeUndefined();
        expect((cached as any).metrics[0].eventSubtype).toBe("api_call");
    });

    test("PARTIAL metrics update flips the metric gate from false to true", async () => {
        // Start below the gate (usage 2 < 5)
        await sendFullCompany(2);
        await sendFlags();

        const before = await check("metric-flag");
        expect(before.reason).not.toBe("RULES_ENGINE_ERROR");
        expect(before.value).toBe(false);

        // Partial metrics update arrives in wire format, bumping usage to 10.
        await messageHandler({
            entity_type: EntityType.COMPANY,
            message_type: MessageType.PARTIAL,
            entity_id: "company-1",
            data: { metrics: [wireMetric(10)] },
        } as DataStreamResp);

        const after = await check("metric-flag");
        expect(after.reason).not.toBe("RULES_ENGINE_ERROR");
        expect(after.value).toBe(true);

        expect(logger.warn).not.toHaveBeenCalledWith(expect.stringContaining("Failed to deserialize"));
        expect(logger.error).not.toHaveBeenCalledWith(expect.stringContaining("Rules engine evaluation failed"));
    });

    test("PARTIAL credit_balances update does not break subsequent evaluation", async () => {
        // Regression: syncEntitlementDerivedFields used to write snake_case
        // credit_remaining next to the canonicalized creditRemaining; the engine
        // rejected the duplicate and every flag check for the company fell back
        // to its default value.
        await sendFullCompany(10);
        await sendFlags();

        const before = await check("always-on");
        expect(before.value).toBe(true);

        await messageHandler({
            entity_type: EntityType.COMPANY,
            message_type: MessageType.PARTIAL,
            entity_id: "company-1",
            data: { credit_balances: { "credit-1": 42.0 } },
        } as DataStreamResp);

        // The entitlement keeps a single canonical field with the fresh value.
        const cached = await client.getCompany({ name: "Wire Corp" });
        const ent = (cached as any).entitlements[0];
        expect(ent.creditRemaining).toBe(42.0);
        expect(ent.credit_remaining).toBeUndefined();

        const after = await check("always-on");
        expect(after.reason).not.toBe("RULES_ENGINE_ERROR");
        expect(after.value).toBe(true);
        expect(logger.error).not.toHaveBeenCalledWith(expect.stringContaining("Rules engine evaluation failed"));
    });
});
