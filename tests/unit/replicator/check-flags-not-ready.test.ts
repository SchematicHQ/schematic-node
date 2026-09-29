/**
 * checkFlags in replicator mode while the replicator reports not ready.
 *
 * When Schematic is unreachable (or the account is closed) the replicator stays
 * up and keeps its Redis cache, but its health endpoint reports ready: false.
 * The SDK should keep evaluating from that cache, as checkFlag already does and
 * as the Go SDK does for both checkFlag and checkFlags.
 *
 * The DataStream client, the Redis key layout and the WASM rules engine are all
 * real here. Redis is the in-memory fake, seeded the way the replicator writes
 * it (snake_case JSON under versioned keys), and only fetch is stubbed, to
 * serve the health response.
 */
import type { DataStreamClient } from "../../../src/datastream";
import { SchematicClient } from "../../../src/wrapper";
import { makeFakeRedis } from "../credits/fake-redis";

const HEALTH_URL = "http://replicator.test/ready";
const CACHE_VERSION = "v-test";

// True once the company has at least 5 "api_call" events. Its default is false,
// so a true result can only come from evaluating the cached company.
const metricFlag = {
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

// Also defaults to false, with an unconditional rule that evaluates to true.
const alwaysOnFlag = {
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

const company = {
    id: "company-1",
    account_id: "account-123",
    environment_id: "env-123",
    keys: { name: "Acme" },
    base_plan_id: null,
    billing_product_ids: [],
    plan_ids: [],
    plan_version_ids: [],
    credit_balances: {},
    metrics: [
        {
            account_id: "account-123",
            environment_id: "env-123",
            company_id: "company-1",
            event_subtype: "api_call",
            period: "all_time",
            month_reset: "first_of_month",
            value: 10,
            created_at: "2026-01-01T00:00:00Z",
        },
    ],
    traits: [],
    rules: [],
    entitlements: [],
};

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

async function waitFor(condition: () => boolean, timeoutMs = 5000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!condition()) {
        if (Date.now() > deadline) throw new Error("timed out waiting for condition");
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
}

describe("checkFlags in replicator mode when the replicator is not ready", () => {
    const realFetch = global.fetch;
    let client: SchematicClient;

    beforeEach(async () => {
        global.fetch = jest.fn(async (input: unknown) => {
            if (String(input) === HEALTH_URL) {
                return new Response(JSON.stringify({ ready: false, cache_version: CACHE_VERSION }), {
                    status: 200,
                    headers: { "content-type": "application/json" },
                });
            }
            // Accept the flag_check events checkFlag sends to the capture service.
            if (String(input).startsWith("https://c.schematichq.com/")) {
                return new Response("{}", { status: 200 });
            }
            throw new Error(`unexpected fetch to ${String(input)}`);
        }) as typeof fetch;

        const redisClient = makeFakeRedis();
        await redisClient.set(`schematic:flags:${CACHE_VERSION}:metric-flag`, JSON.stringify(metricFlag));
        await redisClient.set(`schematic:flags:${CACHE_VERSION}:always-on`, JSON.stringify(alwaysOnFlag));
        await redisClient.set(`schematic:company:${CACHE_VERSION}:company-1`, JSON.stringify(company));
        // Values are JSON, so the lookup key holds a JSON string.
        await redisClient.set(`schematic:company:${CACHE_VERSION}:name:acme`, JSON.stringify("company-1"));

        client = new SchematicClient({
            apiKey: "test-api-key",
            logger,
            useDataStream: true,
            dataStream: {
                replicatorMode: true,
                redisClient,
                replicatorHealthURL: HEALTH_URL,
                replicatorHealthCheck: 60_000,
            },
        });
        client.setFlagDefault("metric-flag", false);
        client.setFlagDefault("always-on", false);

        // Wait for the first health check to land: it carries the cache version
        // the Redis keys are built from, and it reports not ready.
        const datastream = (client as unknown as { datastreamClient: DataStreamClient }).datastreamClient;
        await waitFor(() => datastream.getReplicatorCacheVersion() === CACHE_VERSION);
        expect(datastream.isConnected()).toBe(false);
    });

    afterEach(async () => {
        await client.close();
        global.fetch = realFetch;
        jest.restoreAllMocks();
    });

    it("evaluates every key from the Redis cache instead of calling the API", async () => {
        const apiCheckFlags = jest
            .spyOn(client.features, "checkFlags")
            .mockRejectedValue(new Error("Schematic is unreachable"));
        const apiCheckFlag = jest
            .spyOn(client.features, "checkFlag")
            .mockRejectedValue(new Error("Schematic is unreachable"));

        const results = await client.checkFlags({ company: { name: "Acme" } }, ["metric-flag", "always-on"]);

        expect(results.map((r) => [r.flag, r.value])).toEqual([
            ["metric-flag", true],
            ["always-on", true],
        ]);
        // Evaluated by the rules engine against the cached company, not defaulted.
        for (const result of results) {
            expect(result.reason).not.toMatch(/default/i);
            expect(result.companyId).toBe("company-1");
        }
        expect(apiCheckFlags).not.toHaveBeenCalled();
        expect(apiCheckFlag).not.toHaveBeenCalled();
    });

    it("agrees with checkFlag, which already evaluated from the cache", async () => {
        jest.spyOn(client.features, "checkFlags").mockRejectedValue(new Error("Schematic is unreachable"));
        jest.spyOn(client.features, "checkFlag").mockRejectedValue(new Error("Schematic is unreachable"));

        const single = await client.checkFlag({ company: { name: "Acme" } }, "metric-flag");
        const [bulk] = await client.checkFlags({ company: { name: "Acme" } }, ["metric-flag"]);

        expect(single).toBe(true);
        expect(bulk.value).toBe(single);
    });
});
