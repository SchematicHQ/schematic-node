/**
 * Replicator-mode flag checks are gated on cache readiness.
 *
 * The replicator's /ready endpoint answers ready: true only once its Redis
 * cache is complete for the cache_version it reports. Until then the SDK must
 * not serve from that cache: single (checkFlag, checkFlagWithEntitlement) and
 * bulk (checkFlags with keys) checks both go to the API. Once it is ready both
 * evaluate from the cache, and agree with each other.
 *
 * The DataStream client, the Redis key layout and the WASM rules engine are all
 * real here. Redis is the in-memory fake, seeded the way the replicator writes
 * it (snake_case JSON under versioned keys). fetch is stubbed to serve the
 * health response and accept captured events, and the API calls are mocked on
 * the generated features client.
 */
import { DataStreamClient } from "../../../src/datastream";
import { SchematicClient } from "../../../src/wrapper";
import { type FakeRedis, makeFakeRedis } from "../credits/fake-redis";

const HEALTH_URL = "http://replicator.test/ready";
const CACHE_VERSION = "v-test";

// Evaluates to true for any company: a single rule with no conditions.
function flagOnForEveryone(key: string) {
    return {
        id: `flag-${key}`,
        account_id: "account-123",
        environment_id: "env-123",
        key,
        default_value: false,
        rules: [
            {
                id: `rule-${key}`,
                account_id: "account-123",
                environment_id: "env-123",
                name: "Everyone",
                rule_type: "global_override",
                priority: 1,
                value: true,
                conditions: [],
                condition_groups: [],
            },
        ],
    };
}

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
    metrics: [],
    traits: [],
    rules: [],
    entitlements: [],
};

const evalCtx = { company: { name: "Acme" } };
const FLAG_A = "flag-a";
const FLAG_B = "flag-b";

type HealthResponse = { status: number; body: string } | "unreachable";

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

async function waitFor(condition: () => boolean, timeoutMs = 5000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!condition()) {
        if (Date.now() > deadline) throw new Error("timed out waiting for condition");
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
}

function healthBody(ready: boolean, cacheVersion?: string): string {
    return JSON.stringify(cacheVersion === undefined ? { ready } : { ready, cache_version: cacheVersion });
}

describe("replicator mode flag checks gate on cache readiness", () => {
    const realFetch = global.fetch;
    let health: HealthResponse;
    let healthPolls: number;
    let redisClient: FakeRedis;
    let client: SchematicClient;
    let datastream: DataStreamClient;

    async function startClient(initialHealth: HealthResponse): Promise<void> {
        health = initialHealth;
        client = new SchematicClient({
            apiKey: "test-api-key",
            logger,
            useDataStream: true,
            flagDefaults: { [FLAG_A]: false, [FLAG_B]: false },
            // No local flag-check cache, so every API-path check reaches the
            // mocked API instead of answering from an earlier check's result.
            cacheProviders: { flagChecks: [] },
            dataStream: {
                replicatorMode: true,
                redisClient,
                replicatorHealthURL: HEALTH_URL,
                replicatorHealthCheck: 60_000,
            },
        });
        datastream = (client as unknown as { datastreamClient: DataStreamClient }).datastreamClient;
        await waitFor(() => healthPolls >= 1);
        // Let the poll's response handling finish after fetch resolves.
        await new Promise((resolve) => setTimeout(resolve, 20));
    }

    // Runs one more health poll against whatever `health` now serves.
    async function pollHealth(next: HealthResponse): Promise<void> {
        health = next;
        await (datastream as unknown as { checkReplicatorHealth(): Promise<void> }).checkReplicatorHealth();
    }

    function mockApi(values: Record<string, boolean>) {
        const single = jest.spyOn(client.features, "checkFlag").mockImplementation((async (key: string) => ({
            data: { flag: key, value: values[key], reason: "api", flagId: `api-${key}` },
        })) as never);
        const bulk = jest.spyOn(client.features, "checkFlags").mockImplementation((async () => ({
            data: {
                flags: Object.entries(values).map(([flag, value]) => ({
                    flag,
                    value,
                    reason: "api",
                    flagId: `api-${flag}`,
                })),
            },
        })) as never);
        return { single, bulk };
    }

    function failApi() {
        const single = jest
            .spyOn(client.features, "checkFlag")
            .mockRejectedValue(new Error("Schematic is unreachable"));
        const bulk = jest.spyOn(client.features, "checkFlags").mockRejectedValue(new Error("Schematic is unreachable"));
        return { single, bulk };
    }

    beforeEach(async () => {
        healthPolls = 0;
        global.fetch = jest.fn(async (input: unknown) => {
            if (String(input) === HEALTH_URL) {
                healthPolls++;
                if (health === "unreachable") throw new TypeError("fetch failed: connect ECONNREFUSED");
                return new Response(health.body, {
                    status: health.status,
                    headers: { "content-type": "application/json" },
                });
            }
            // Accept the events checkFlag sends to the capture service.
            if (String(input).startsWith("https://c.schematichq.com/")) {
                return new Response("{}", { status: 200 });
            }
            throw new Error(`unexpected fetch to ${String(input)}`);
        }) as typeof fetch;

        redisClient = makeFakeRedis();
        for (const key of [FLAG_A, FLAG_B]) {
            await redisClient.set(`schematic:flags:${CACHE_VERSION}:${key}`, JSON.stringify(flagOnForEveryone(key)));
        }
        await redisClient.set(`schematic:company:${CACHE_VERSION}:company-1`, JSON.stringify(company));
        // Values are JSON, so the lookup key holds a JSON string.
        await redisClient.set(`schematic:company:${CACHE_VERSION}:name:acme`, JSON.stringify("company-1"));
    });

    afterEach(async () => {
        await client.close();
        global.fetch = realFetch;
        jest.restoreAllMocks();
    });

    describe("while the replicator reports not ready", () => {
        beforeEach(async () => {
            await startClient({ status: 503, body: healthBody(false, CACHE_VERSION) });
            expect(datastream.isCacheReady()).toBe(false);
            expect(datastream.getReplicatorCacheVersion()).toBe(CACHE_VERSION);
        });

        it("single and bulk checks skip the cache and return the API's values", async () => {
            const cacheRead = jest.spyOn(datastream, "checkFlag");
            const api = mockApi({ [FLAG_A]: false, [FLAG_B]: false });

            const single = await client.checkFlagWithEntitlement(evalCtx, FLAG_A);
            const singleBool = await client.checkFlag(evalCtx, FLAG_B);
            const bulk = await client.checkFlags(evalCtx, [FLAG_A, FLAG_B]);

            // The cache would have answered true for both.
            expect(single).toMatchObject({ flagKey: FLAG_A, value: false, reason: "api" });
            expect(singleBool).toBe(false);
            expect(bulk.map((r) => [r.flag, r.value, r.reason])).toEqual([
                [FLAG_A, false, "api"],
                [FLAG_B, false, "api"],
            ]);
            expect(cacheRead).not.toHaveBeenCalled();
            expect(api.single).toHaveBeenCalledTimes(2);
            expect(api.bulk).toHaveBeenCalledTimes(1);
        });

        it("single and bulk checks return flag defaults when the API fails", async () => {
            const cacheRead = jest.spyOn(datastream, "checkFlag");
            failApi();

            const single = await client.checkFlagWithEntitlement(evalCtx, FLAG_A);
            const singleWithDefault = await client.checkFlag(evalCtx, FLAG_B, { defaultValue: false });
            const bulk = await client.checkFlags(evalCtx, [FLAG_A, FLAG_B]);

            expect(single).toMatchObject({ flagKey: FLAG_A, value: false, reason: "flag default" });
            expect(singleWithDefault).toBe(false);
            expect(bulk.map((r) => [r.flag, r.value])).toEqual([
                [FLAG_A, false],
                [FLAG_B, false],
            ]);
            expect(cacheRead).not.toHaveBeenCalled();
        });
    });

    describe("once the replicator reports ready", () => {
        beforeEach(async () => {
            await startClient({ status: 200, body: healthBody(true, CACHE_VERSION) });
            expect(datastream.isCacheReady()).toBe(true);
        });

        it("single and bulk checks evaluate from the cache with no API call, and agree", async () => {
            const api = mockApi({ [FLAG_A]: false, [FLAG_B]: false });

            const singleA = await client.checkFlagWithEntitlement(evalCtx, FLAG_A);
            const singleB = await client.checkFlag(evalCtx, FLAG_B);
            const bulk = await client.checkFlags(evalCtx, [FLAG_A, FLAG_B]);

            expect(singleA).toMatchObject({ flagKey: FLAG_A, value: true, flagId: `flag-${FLAG_A}` });
            expect(singleB).toBe(true);
            expect(bulk.map((r) => [r.flag, r.value, r.flagId])).toEqual([
                [FLAG_A, true, `flag-${FLAG_A}`],
                [FLAG_B, true, `flag-${FLAG_B}`],
            ]);
            expect(bulk[0].reason).toBe(singleA.reason);
            expect(api.single).not.toHaveBeenCalled();
            expect(api.bulk).not.toHaveBeenCalled();
        });

        it("single and bulk checks still fall back to the API for a flag the cache lacks", async () => {
            const api = mockApi({ [FLAG_A]: true, "not-cached": true });

            const single = await client.checkFlagWithEntitlement(evalCtx, "not-cached");
            const bulk = await client.checkFlags(evalCtx, [FLAG_A, "not-cached"]);

            expect(single).toMatchObject({ flagKey: "not-cached", value: true, reason: "api" });
            expect(bulk.map((r) => [r.flag, r.value, r.reason])).toEqual([
                [FLAG_A, true, "api"],
                ["not-cached", true, "api"],
            ]);
            expect(api.single).toHaveBeenCalledTimes(1);
            expect(api.bulk).toHaveBeenCalledTimes(1);
        });

        it("goes back to the API when the replicator stops reporting ready", async () => {
            await pollHealth({ status: 503, body: healthBody(false, CACHE_VERSION) });
            const api = mockApi({ [FLAG_A]: false });

            expect(await client.checkFlag(evalCtx, FLAG_A)).toBe(false);
            expect((await client.checkFlags(evalCtx, [FLAG_A]))[0].value).toBe(false);
            expect(api.single).toHaveBeenCalledTimes(1);
            expect(api.bulk).toHaveBeenCalledTimes(1);
        });
    });

    describe("health polling", () => {
        beforeEach(async () => {
            await startClient({ status: 200, body: healthBody(true, "v1") });
            expect(datastream.isCacheReady()).toBe(true);
            expect(datastream.getReplicatorCacheVersion()).toBe("v1");
        });

        it("reads a 503 body: sets not ready and records its cache_version", async () => {
            await pollHealth({ status: 503, body: healthBody(false, "vX") });

            expect(datastream.isCacheReady()).toBe(false);
            expect(datastream.isConnected()).toBe(false);
            expect(datastream.getReplicatorCacheVersion()).toBe("vX");
        });

        it("becomes ready from a 200 after a 503 for the same cache_version", async () => {
            await pollHealth({ status: 503, body: healthBody(false, "vX") });
            await pollHealth({ status: 200, body: healthBody(true, "vX") });

            expect(datastream.isCacheReady()).toBe(true);
            expect(datastream.isConnected()).toBe(true);
            expect(datastream.getReplicatorCacheVersion()).toBe("vX");
        });

        it("keeps the cache_version when a response carries none", async () => {
            await pollHealth({ status: 503, body: healthBody(false) });

            expect(datastream.isCacheReady()).toBe(false);
            expect(datastream.getReplicatorCacheVersion()).toBe("v1");
        });

        it("an unreachable health URL sets not ready and keeps the previous cache_version", async () => {
            await pollHealth("unreachable");

            expect(datastream.isCacheReady()).toBe(false);
            expect(datastream.isConnected()).toBe(false);
            expect(datastream.getReplicatorCacheVersion()).toBe("v1");
        });

        it("an unparseable body sets not ready and keeps the previous cache_version", async () => {
            await pollHealth({ status: 503, body: "Service Unavailable" });

            expect(datastream.isCacheReady()).toBe(false);
            expect(datastream.getReplicatorCacheVersion()).toBe("v1");
        });
    });

    it("isCacheReady is true outside replicator mode", () => {
        // An offline client only so the shared afterEach has one to close.
        // The WebSocket-mode DataStream client is never started.
        client = new SchematicClient({ apiKey: "test-api-key", logger, offline: true });
        const websocketMode = new DataStreamClient({ apiKey: "test-api-key", logger });

        expect(websocketMode.isReplicatorMode()).toBe(false);
        expect(websocketMode.isCacheReady()).toBe(true);
        websocketMode.close();
    });
});
