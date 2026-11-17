/**
 * A client-mode credit check in replicator mode waits on the same cache
 * readiness as plain flag checks.
 *
 * While the replicator reloads, /ready answers 503 with ready: false and the
 * cache_version it is loading, and the SDK starts keying cache reads by that
 * version. The lease flow reads the flag, company and user from the cache, so
 * without the gate it would read a half-loaded version. With it, the check
 * runs as the plain API check and reads nothing from the cache.
 *
 * The DataStream client, the Redis key layout and the WASM rules engine are
 * real; Redis is the in-memory fake.
 */
import type { DataStreamClient } from "../../../src/datastream";
import { SchematicClient } from "../../../src/wrapper";
import { type FakeRedis, makeFakeRedis } from "../credits/fake-redis";

const HEALTH_URL = "http://replicator.test/ready";
const LOADED_VERSION = "v-loaded";
const LOADING_VERSION = "v-loading";
const FLAG = "inference";

const logger = { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() };

async function waitFor(condition: () => boolean, timeoutMs = 5000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (!condition()) {
        if (Date.now() > deadline) throw new Error("timed out waiting for condition");
        await new Promise((resolve) => setTimeout(resolve, 10));
    }
}

describe("replicator mode credit-lease check while the cache is not ready", () => {
    const realFetch = global.fetch;
    let health: { status: number; body: string };
    let healthPolls: number;
    let redisClient: FakeRedis;
    let client: SchematicClient;
    let datastream: DataStreamClient;

    beforeEach(async () => {
        healthPolls = 0;
        health = { status: 200, body: JSON.stringify({ ready: true, cache_version: LOADED_VERSION }) };
        global.fetch = jest.fn(async (input: unknown) => {
            if (String(input) === HEALTH_URL) {
                healthPolls++;
                return new Response(health.body, {
                    status: health.status,
                    headers: { "content-type": "application/json" },
                });
            }
            if (String(input).startsWith("https://c.schematichq.com/")) {
                return new Response("{}", { status: 200 });
            }
            throw new Error(`unexpected fetch to ${String(input)}`);
        }) as typeof fetch;

        redisClient = makeFakeRedis();
        client = new SchematicClient({
            apiKey: "test-api-key",
            logger,
            useDataStream: true,
            cacheProviders: { flagChecks: [] },
            dataStream: {
                replicatorMode: true,
                redisClient,
                replicatorHealthURL: HEALTH_URL,
                replicatorHealthCheck: 60_000,
            },
            creditLeases: { mode: "client", sweepIntervalMs: 60_000 },
        });
        datastream = (client as unknown as { datastreamClient: DataStreamClient }).datastreamClient;
        await waitFor(() => healthPolls >= 1);
        await new Promise((resolve) => setTimeout(resolve, 20));
    });

    afterEach(async () => {
        await client.close();
        global.fetch = realFetch;
        jest.restoreAllMocks();
    });

    it("runs the plain API check and reads nothing from the version still loading", async () => {
        expect(datastream.isCacheReady()).toBe(true);

        health = { status: 503, body: JSON.stringify({ ready: false, cache_version: LOADING_VERSION }) };
        await (datastream as unknown as { checkReplicatorHealth(): Promise<void> }).checkReplicatorHealth();
        expect(datastream.isCacheReady()).toBe(false);
        expect(datastream.getReplicatorCacheVersion()).toBe(LOADING_VERSION);

        const reads = [
            jest.spyOn(datastream, "getFlag"),
            jest.spyOn(datastream, "getCompany"),
            jest.spyOn(datastream, "getUser"),
            jest.spyOn(datastream, "checkFlag"),
        ];
        const acquire = jest.spyOn(client.credits, "acquireCreditLease");
        const api = jest.spyOn(client.features, "checkFlag").mockImplementation((async () => ({
            data: { flag: FLAG, value: true, reason: "api" },
        })) as never);

        const result = await client.check({ company: { name: "Acme" } }, FLAG, {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(result).toMatchObject({ allowed: true, reason: "api" });
        expect(result.reservation).toBeUndefined();
        expect(api).toHaveBeenCalledTimes(1);
        expect(acquire).not.toHaveBeenCalled();
        for (const read of reads) expect(read).not.toHaveBeenCalled();
    });
});
