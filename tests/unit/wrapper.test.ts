import { SchematicClient } from "../../src/wrapper";
import type { CacheProvider } from "../../src/cache";
import type { CheckFlagWithEntitlementResponse } from "../../src/wrapper";

// Mock the features.checkFlag API call
const mockCheckFlag = jest.fn();

jest.mock("../../src/Client", () => {
    class MockBaseClient {
        features = {
            checkFlag: mockCheckFlag,
            checkFlags: jest.fn().mockResolvedValue({
                data: { flags: [] },
            }),
        };
        events = {};
    }
    return { SchematicClient: MockBaseClient };
});

// Mock the EventBuffer to avoid side effects
jest.mock("../../src/events", () => {
    return {
        EventBuffer: jest.fn().mockImplementation(() => ({
            push: jest.fn(),
            flush: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn().mockResolvedValue(undefined),
        })),
    };
});

describe("SchematicClient wrapper - flag checking behavior", () => {
    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("offline mode", () => {
        it("should return configured default in offline mode", async () => {
            const client = new SchematicClient({
                offline: true,
                flagDefaults: { "test-flag": true },
                logger: mockLogger,
            });

            const result = await client.checkFlag({}, "test-flag");

            expect(result).toBe(true);
            expect(mockCheckFlag).not.toHaveBeenCalled();

            await client.close();
        });

        it("should return false in offline mode when no default configured", async () => {
            const client = new SchematicClient({
                offline: true,
                logger: mockLogger,
            });

            const result = await client.checkFlag({}, "unknown-flag");

            expect(result).toBe(false);
            expect(mockCheckFlag).not.toHaveBeenCalled();

            await client.close();
        });
    });

    describe("API error handling", () => {
        it("should return false when API errors and no default configured", async () => {
            mockCheckFlag.mockRejectedValue(new Error("API unavailable"));

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
            });

            const result = await client.checkFlag({ company: { id: "comp-1" } }, "test-flag");

            expect(result).toBe(false);

            await client.close();
        });

        it("should return configured default when API errors", async () => {
            mockCheckFlag.mockRejectedValue(new Error("API unavailable"));

            const client = new SchematicClient({
                apiKey: "test-api-key",
                flagDefaults: { "test-flag": true },
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
            });

            const result = await client.checkFlag({ company: { id: "comp-1" } }, "test-flag");

            expect(result).toBe(true);

            await client.close();
        });
    });

    describe("caching behavior", () => {
        it("should use different cache keys for different contexts", async () => {
            mockCheckFlag.mockResolvedValue({
                data: {
                    value: true,
                    flag: "test-flag",
                    reason: "match",
                },
            });

            const mockCacheProvider: CacheProvider<CheckFlagWithEntitlementResponse> = {
                get: jest.fn().mockResolvedValue(null),
                set: jest.fn().mockResolvedValue(undefined),
                delete: jest.fn().mockResolvedValue(undefined),
            };

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [mockCacheProvider] },
                logger: mockLogger,
            });

            await client.checkFlag({ company: { id: "comp-1" } }, "test-flag");
            await client.checkFlag({ company: { id: "comp-2" } }, "test-flag");

            // Two different contexts should produce two cache get calls with different keys
            expect(mockCacheProvider.get).toHaveBeenCalledTimes(2);
            const firstKey = (mockCacheProvider.get as jest.Mock).mock.calls[0][0];
            const secondKey = (mockCacheProvider.get as jest.Mock).mock.calls[1][0];
            expect(firstKey).not.toEqual(secondKey);

            // Two API calls should have been made since cache returned null both times
            expect(mockCheckFlag).toHaveBeenCalledTimes(2);

            await client.close();
        });

        it("should return API value when cache is disabled", async () => {
            mockCheckFlag.mockResolvedValue({
                data: {
                    value: true,
                    flag: "test-flag",
                    reason: "match",
                },
            });

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
            });

            const result1 = await client.checkFlag({ company: { id: "comp-1" } }, "test-flag");
            const result2 = await client.checkFlag({ company: { id: "comp-1" } }, "test-flag");

            expect(result1).toBe(true);
            expect(result2).toBe(true);

            // With no cache providers, every call should hit the API
            expect(mockCheckFlag).toHaveBeenCalledTimes(2);

            await client.close();
        });
    });
    describe("event options", () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { EventBuffer } = require("../../src/events");

        const lastPushedEvent = (): any => {
            const buffer = (EventBuffer as jest.Mock).mock.results[0].value;
            const pushMock = buffer.push as jest.Mock;
            return pushMock.mock.calls[pushMock.mock.calls.length - 1][0];
        };

        it("should thread track options into the buffered event", async () => {
            const client = new SchematicClient({ apiKey: "test-api-key", logger: mockLogger });
            const sentAt = new Date("2026-04-28T12:00:00.000Z");

            await client.track(
                { event: "used-feature", company: { id: "comp-1" } },
                {
                    idempotencyKey: "dedupe-abc",
                    sentAt,
                    trustedClientClock: true,
                    backfill: true,
                },
            );

            expect(lastPushedEvent()).toEqual({
                eventType: "track",
                body: { event: "used-feature", company: { id: "comp-1" } },
                idempotencyKey: "dedupe-abc",
                sentAt,
                trustedClientClock: true,
                backfill: true,
            });

            await client.close();
        });

        it("should thread identify idempotencyKey into the buffered event", async () => {
            const client = new SchematicClient({ apiKey: "test-api-key", logger: mockLogger });

            await client.identify({ keys: { id: "user-1" }, name: "Test User" }, { idempotencyKey: "dedupe-xyz" });

            const event = lastPushedEvent();
            expect(event.eventType).toBe("identify");
            expect(event.idempotencyKey).toBe("dedupe-xyz");
            expect(event.trustedClientClock).toBeUndefined();
            expect(event.backfill).toBeUndefined();

            await client.close();
        });

        it("should default sentAt and omit optional fields when no options are passed", async () => {
            const client = new SchematicClient({ apiKey: "test-api-key", logger: mockLogger });

            await client.track({ event: "used-feature", company: { id: "comp-1" } });

            const event = lastPushedEvent();
            expect(event.sentAt).toBeInstanceOf(Date);
            expect(event).not.toHaveProperty("idempotencyKey");
            expect(event).not.toHaveProperty("trustedClientClock");
            expect(event).not.toHaveProperty("backfill");

            await client.close();
        });
    });

    describe("identify with prewarm", () => {
        it("forwards prewarm credit type ids to client.prewarm and flushes the buffer", async () => {
            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
            });
            const prewarmSpy = jest.spyOn(client, "prewarm").mockResolvedValue(undefined);
            // Reach into the buffer mock to verify flush is triggered so the
            // server picks up the identify event before prewarm starts polling.
            // biome-ignore lint/suspicious/noExplicitAny: introspect mock
            const flushMock = (client as any).eventBuffer.flush as jest.Mock;

            await client.identify(
                {
                    keys: { id: "user-1" },
                    company: { keys: { id: "comp-1" } },
                },
                { prewarm: ["credit-type-1", "credit-type-2"] },
            );

            // Yield once so the fire-and-forget prewarm resolves.
            await new Promise((r) => setImmediate(r));

            expect(flushMock).toHaveBeenCalledTimes(1);
            expect(prewarmSpy).toHaveBeenCalledWith({ company: { id: "comp-1" }, user: { id: "user-1" } }, [
                "credit-type-1",
                "credit-type-2",
            ]);

            await client.close();
        });

        it("does not call prewarm or flush when options.prewarm is omitted", async () => {
            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
            });
            const prewarmSpy = jest.spyOn(client, "prewarm").mockResolvedValue(undefined);
            // biome-ignore lint/suspicious/noExplicitAny: introspect mock
            const flushMock = (client as any).eventBuffer.flush as jest.Mock;

            await client.identify({
                keys: { id: "user-1" },
                company: { keys: { id: "comp-1" } },
            });

            await new Promise((r) => setImmediate(r));
            expect(prewarmSpy).not.toHaveBeenCalled();
            expect(flushMock).not.toHaveBeenCalled();

            await client.close();
        });
    });
});

describe("SchematicClient wrapper - logger configuration", () => {
    let consoleSpy: {
        debug: ReturnType<typeof jest.spyOn>;
        warn: ReturnType<typeof jest.spyOn>;
    };

    beforeEach(() => {
        consoleSpy = {
            debug: jest.spyOn(console, "debug").mockImplementation(() => {}),
            warn: jest.spyOn(console, "warn").mockImplementation(() => {}),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    it("should suppress debug logs from the default logger (defaults to warn)", async () => {
        const client = new SchematicClient({ offline: true });

        // Offline checkFlag logs at debug level, which the default warn logger drops.
        await client.checkFlag({}, "some-flag");

        expect(consoleSpy.debug).not.toHaveBeenCalled();

        await client.close();
    });

    it("should emit debug logs from the default logger when logLevel is debug", async () => {
        const client = new SchematicClient({ offline: true, logLevel: "debug" });

        await client.checkFlag({}, "some-flag");

        expect(consoleSpy.debug).toHaveBeenCalled();

        await client.close();
    });

    it("should call a custom logger's methods directly, ignoring logLevel", async () => {
        const customLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };

        // logLevel is set to warn, but the SDK must not filter a custom logger —
        // the custom logger owns its own level.
        const client = new SchematicClient({
            offline: true,
            logLevel: "warn",
            logger: customLogger,
        });

        await client.checkFlag({}, "some-flag");

        expect(customLogger.debug).toHaveBeenCalled();
        // The built-in console must not be used when a custom logger is provided.
        expect(consoleSpy.debug).not.toHaveBeenCalled();

        await client.close();
    });
});
describe("SchematicClient wrapper - credit lease store backend selection", () => {
    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("reuses the DataStream Redis client for lease state when no creditLeases.redisClient is set", async () => {
        const { makeFakeRedis } = await import("./credits/fake-redis");
        const redisClient = makeFakeRedis();
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            creditLeases: {},
            dataStream: { redisClient },
        });
        // The shared Redis backend must back leases automatically — no second
        // client to wire up — so both stores are the Redis-backed variants.
        expect((client as any).leaseStore?.constructor?.name).toBe("RedisLeaseStore");
        expect((client as any).reservations?.constructor?.name).toBe("RedisReservationStore");
        // No degrade warning when a shared backend is present.
        expect(mockLogger.warn).not.toHaveBeenCalledWith(
            expect.stringContaining("creditLeases is enabled without a shared Redis backend"),
        );
        (client as any).reservations?.stop?.();
    });

    it("falls back to in-memory stores and warns when no Redis backend is configured", async () => {
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            creditLeases: {},
        });
        expect((client as any).leaseStore?.constructor?.name).toBe("LeaseStore");
        expect((client as any).reservations?.constructor?.name).toBe("ReservationStore");
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining("creditLeases is enabled without a shared Redis backend"),
        );
        (client as any).reservations?.stop?.();
    });

    it("warns at construction when creditLeases is configured without DataStream", async () => {
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            creditLeases: {},
        });
        // Without DataStream, every check() silently falls back to a plain flag
        // check with no credit gating — surface that once, loudly.
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining("creditLeases is configured but DataStream is not enabled"),
        );
        (client as any).reservations?.stop?.();
    });

    it("does not warn about DataStream when it is enabled alongside creditLeases", async () => {
        const { makeFakeRedis } = await import("./credits/fake-redis");
        const redisClient = makeFakeRedis();
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            useDataStream: true,
            // Replicator mode: no WebSocket connection in unit tests.
            dataStream: { replicatorMode: true, redisClient },
            creditLeases: {},
        });
        expect(mockLogger.warn).not.toHaveBeenCalledWith(
            expect.stringContaining("creditLeases is configured but DataStream is not enabled"),
        );
        await client.close();
    });

    it("warns at construction when creditLeases is configured in offline mode", async () => {
        const client = new SchematicClient({
            offline: true,
            logger: mockLogger,
            creditLeases: {},
        });
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining("creditLeases is configured but the client is in offline mode"),
        );
        // Offline skips lease plumbing entirely — nothing to stop.
        expect((client as any).leaseStore).toBeUndefined();
        await client.close();
    });

    it("close() does not release outstanding leases (they reclaim via expiry, not shutdown)", async () => {
        const { makeFakeRedis } = await import("./credits/fake-redis");
        const redisClient = makeFakeRedis();
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            creditLeases: {},
            dataStream: { redisClient },
        });
        // A shared lease lives in the backend (could have been installed by this
        // pod or a sibling). Releasing it on this pod's shutdown would pull the
        // grant out from under siblings — so close() must leave it alone.
        const leaseStore = (client as any).leaseStore;
        await leaseStore.replace({
            leaseId: "lse_shared",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 5 * 60_000),
        });

        await client.close();

        // The old close() released + dropped every lease in the shared backend;
        // the lease must now survive shutdown so siblings keep drawing on it.
        const survivor = await leaseStore.get("co_1", "ct_1");
        expect(survivor).toBeDefined();
        expect(survivor?.leaseId).toBe("lse_shared");
    });
});
