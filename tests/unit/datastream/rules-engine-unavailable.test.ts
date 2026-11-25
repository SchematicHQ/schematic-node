import type { DataStreamClient } from "../../../src/datastream";
import { type DataStreamResp, EntityType, MessageType } from "../../../src/datastream/types";
import { DatastreamWSClient } from "../../../src/datastream/websocket-client";
import { RulesEngineClient } from "../../../src/rules-engine";
import { SchematicClient } from "../../../src/wrapper";

const mockWS = {
    on: jest.fn(),
    start: jest.fn(),
    close: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true),
    isReady: jest.fn().mockReturnValue(true),
    sendMessage: jest.fn().mockResolvedValue(undefined),
};
jest.mock("../../../src/datastream/websocket-client", () => ({
    DatastreamWSClient: jest.fn().mockImplementation(() => mockWS),
}));

const FLAG_A = "flag-a";
const FLAG_B = "flag-b";

const wireFlag = (key: string) => ({
    id: `flag-${key}`,
    account_id: "account-123",
    environment_id: "env-123",
    key,
    default_value: false,
    rules: [],
});

const wireCompany = {
    id: "company-1",
    account_id: "account-123",
    environment_id: "env-123",
    keys: { name: "Acme" },
    base_plan_id: null,
    billing_product_ids: [],
    plan_ids: [],
    plan_version_ids: [],
    credit_balances: {},
    metrics: [],
    traits: [],
    rules: [],
    entitlements: [],
};

const evalCtx = { company: { name: "Acme" } };

async function waitFor(condition: () => boolean, timeoutMs = 5000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!condition()) {
        if (Date.now() > deadline) throw new Error("timed out waiting for condition");
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
}

describe("DataStream flag checks when the rules engine failed to load", () => {
    const realFetch = global.fetch;
    const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    let client: SchematicClient;
    let datastream: DataStreamClient;

    beforeEach(async () => {
        jest.clearAllMocks();
        jest.spyOn(RulesEngineClient.prototype, "initialize").mockRejectedValue(new Error("wasm missing"));
        global.fetch = jest.fn(async () => new Response("{}", { status: 200 })) as typeof fetch;

        client = new SchematicClient({
            apiKey: "test-api-key",
            logger,
            useDataStream: true,
            flagDefaults: { [FLAG_A]: false, [FLAG_B]: false },
            cacheProviders: { flagChecks: [] },
            creditLeases: { mode: "client" },
        });
        datastream = (client as unknown as { datastreamClient: DataStreamClient }).datastreamClient;

        const WSMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
        await waitFor(() => WSMock.mock.calls.length > 0);
        const messageHandler = WSMock.mock.calls[0][0].messageHandler as (m: DataStreamResp) => Promise<void>;
        await messageHandler({
            entity_type: EntityType.FLAGS,
            message_type: MessageType.FULL,
            data: [wireFlag(FLAG_A), wireFlag(FLAG_B)],
        } as DataStreamResp);
        await messageHandler({
            entity_type: EntityType.COMPANY,
            message_type: MessageType.FULL,
            data: wireCompany,
        } as DataStreamResp);

        expect(datastream.getRulesEngine().isInitialized()).toBe(false);
        expect(await datastream.getFlag(FLAG_A)).not.toBeNull();
    });

    afterEach(async () => {
        await client.close();
        global.fetch = realFetch;
        jest.restoreAllMocks();
    });

    function mockApi(values: Record<string, boolean>) {
        const single = jest.spyOn(client.features, "checkFlag").mockImplementation((async (key: string) => ({
            data: { flag: key, value: values[key], reason: "api", flagId: `api-${key}` },
        })) as never);
        const bulk = jest.spyOn(client.features, "checkFlags").mockImplementation((async () => ({
            data: {
                flags: Object.entries(values).map(([flag, value]) => ({ flag, value, reason: "api" })),
            },
        })) as never);
        return { single, bulk };
    }

    it("single checks return the API's value", async () => {
        const api = mockApi({ [FLAG_A]: true, [FLAG_B]: true });

        expect(await client.checkFlag(evalCtx, FLAG_A)).toBe(true);
        expect(await client.checkFlagWithEntitlement(evalCtx, FLAG_B)).toMatchObject({
            flagKey: FLAG_B,
            value: true,
            reason: "api",
        });
        expect(api.single).toHaveBeenCalledTimes(2);
    });

    it("bulk checks return the API's values", async () => {
        const api = mockApi({ [FLAG_A]: true, [FLAG_B]: true });

        const results = await client.checkFlags(evalCtx, [FLAG_A, FLAG_B]);

        expect(results.map((r) => [r.flag, r.value, r.reason])).toEqual([
            [FLAG_A, true, "api"],
            [FLAG_B, true, "api"],
        ]);
        expect(api.bulk).toHaveBeenCalledTimes(1);
    });

    it("credit-lease checks return the API's value without touching the lease", async () => {
        const api = mockApi({ [FLAG_A]: true });
        const acquire = jest.spyOn(client.credits, "acquireCreditLease");

        const result = await client.check(evalCtx, FLAG_A, { usage: 1 });

        expect(result).toMatchObject({ allowed: true, reason: "api" });
        expect(api.single).toHaveBeenCalledTimes(1);
        expect(acquire).not.toHaveBeenCalled();
    });

    it("warns about the fallback once", async () => {
        mockApi({ [FLAG_A]: true, [FLAG_B]: true });
        logger.warn.mockClear();

        await client.checkFlag(evalCtx, FLAG_A);
        await client.checkFlag(evalCtx, FLAG_B);
        await client.checkFlags(evalCtx, [FLAG_A, FLAG_B]);

        const fallbackWarnings = logger.warn.mock.calls.filter(([msg]) =>
            String(msg).includes("Rules engine not initialized"),
        );
        expect(fallbackWarnings).toHaveLength(1);
    });
});
