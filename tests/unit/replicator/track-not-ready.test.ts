/**
 * track in replicator mode while the replicator reports not ready.
 *
 * When Schematic is unreachable (or the account is closed) the replicator stays
 * up and keeps its Redis cache, but its health endpoint reports ready: false.
 * Flag checks keep evaluating from that cache, so track has to keep bumping the
 * cached company's metrics or usage stops counting against numeric limits.
 *
 * The DataStream client, the Redis key layout and the WASM rules engine are all
 * real here. Redis is the in-memory fake, seeded the way the replicator writes
 * it (snake_case JSON under versioned keys), and only fetch is stubbed, to
 * serve the health response and accept the captured events.
 */
import type { DataStreamClient } from "../../../src/datastream";
import { SchematicClient } from "../../../src/wrapper";
import { type FakeRedis, makeFakeRedis } from "../credits/fake-redis";

const HEALTH_URL = "http://replicator.test/ready";
const CACHE_VERSION = "v-test";
const COMPANY_KEY = `schematic:company:${CACHE_VERSION}:company-1`;

// True once the company has at least 5 "api_call" events.
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
            value: 3,
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

describe("track in replicator mode when the replicator is not ready", () => {
    const realFetch = global.fetch;
    let redisClient: FakeRedis;
    let client: SchematicClient;
    let replicatorReady: boolean;

    const cachedMetricValue = async (): Promise<number> => {
        const raw = await redisClient.get(COMPANY_KEY);
        if (raw === null) throw new Error("company is not in the cache");
        return JSON.parse(raw).metrics[0].value;
    };

    beforeEach(async () => {
        replicatorReady = false;
        global.fetch = jest.fn(async (input: unknown) => {
            if (String(input) === HEALTH_URL) {
                return new Response(JSON.stringify({ ready: replicatorReady, cache_version: CACHE_VERSION }), {
                    status: 200,
                    headers: { "content-type": "application/json" },
                });
            }
            // Accept the events track and checkFlag send to the capture service.
            if (String(input).startsWith("https://c.schematichq.com/")) {
                return new Response("{}", { status: 200 });
            }
            throw new Error(`unexpected fetch to ${String(input)}`);
        }) as typeof fetch;

        redisClient = makeFakeRedis();
        await redisClient.set(`schematic:flags:${CACHE_VERSION}:metric-flag`, JSON.stringify(metricFlag));
        await redisClient.set(COMPANY_KEY, JSON.stringify(company));
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

    it("bumps the cached company metric", async () => {
        await client.track({ event: "api_call", company: { name: "Acme" }, quantity: 2 });

        expect(await cachedMetricValue()).toBe(5);
        expect(logger.error).not.toHaveBeenCalled();
    });

    it("counts usage a metric-gated flag check sees once the replicator is ready", async () => {
        jest.spyOn(client.features, "checkFlag").mockRejectedValue(new Error("Schematic is unreachable"));
        const check = () => client.checkFlag({ company: { name: "Acme" } }, "metric-flag");

        await client.track({ event: "api_call", company: { name: "Acme" } });
        await client.track({ event: "api_call", company: { name: "Acme" } });
        expect(await cachedMetricValue()).toBe(5);

        // Not ready: flag checks skip the cache and ask the API, which is down,
        // so they return the flag default even though the cache has moved.
        expect(await check()).toBe(false);

        // Once the replicator reports ready, the check reads the tracked usage.
        replicatorReady = true;
        const datastream = (client as unknown as { datastreamClient: { checkReplicatorHealth(): Promise<void> } })
            .datastreamClient;
        await datastream.checkReplicatorHealth();
        expect(await check()).toBe(true);
    });

    it("leaves the cache alone for a company it does not hold", async () => {
        const before = [...(await collectKeys(redisClient))].sort();

        await client.track({ event: "api_call", company: { name: "Unknown Co" }, quantity: 2 });

        expect([...(await collectKeys(redisClient))].sort()).toEqual(before);
        expect(await cachedMetricValue()).toBe(3);
    });
});

async function collectKeys(redis: FakeRedis): Promise<Set<string>> {
    const keys = new Set<string>();
    for await (const key of redis.scanIterator({ MATCH: "*", COUNT: 1000 })) {
        keys.add(String(key));
    }
    return keys;
}
