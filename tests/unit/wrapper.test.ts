import { SchematicClient } from "../../src/wrapper";
import type { CacheProvider } from "../../src/cache";
import {
    MAX_RESERVATION_TTL_MS,
    RESERVATION_TTL_SKEW_ALLOWANCE_MS,
    SHUTDOWN_DRAIN_TIMEOUT_MS,
} from "../../src/credits";
import type { CheckFlagWithEntitlementResponse } from "../../src/wrapper";

// Mock the features.checkFlag API call
const mockCheckFlag = jest.fn();
const mockCheckAndReserveFlag = jest.fn();
const mockAcquireCreditLease = jest.fn();
const mockReleaseCreditLease = jest.fn();
const mockReleaseCreditReservation = jest.fn();

jest.mock("../../src/Client", () => {
    class MockBaseClient {
        features = {
            checkFlag: mockCheckFlag,
            checkAndReserveFlag: mockCheckAndReserveFlag,
            checkFlags: jest.fn().mockResolvedValue({
                data: { flags: [] },
            }),
        };
        credits = {
            acquireCreditLease: mockAcquireCreditLease,
            extendCreditLease: jest.fn(),
            releaseCreditLease: mockReleaseCreditLease,
            releaseCreditReservation: mockReleaseCreditReservation,
        };
        events = {};
    }
    return { SchematicClient: MockBaseClient };
});

// Stubbed DataStream so the routing cases can run without a websocket.
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
jest.mock("../../src/datastream", () => ({
    DataStreamClient: jest.fn().mockImplementation(() => mockDataStream),
}));

// `mockRejectedValue` survives `clearAllMocks`, so put the stub back to a
// healthy DataStream before every test.
beforeEach(() => {
    mockDataStream.start.mockResolvedValue(undefined);
    mockDataStream.isConnected.mockReturnValue(true);
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
    describe("REST preflight", () => {
        const apiAllows = (value: boolean): void => {
            mockCheckFlag.mockResolvedValue({
                data: { value, flag: "test-flag", reason: "match" },
            });
        };

        const newCacheProvider = (cached: CheckFlagWithEntitlementResponse | null = null) => ({
            get: jest.fn().mockResolvedValue(cached),
            set: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
        });

        it("sends the check options' preflight on the request body", async () => {
            apiAllows(true);

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
            });

            await client.checkFlag({ company: { id: "comp-1" } }, "test-flag", {
                usage: 5,
                creditCost: { "credit-1": 20 },
            });

            const [flagKey, body] = mockCheckFlag.mock.calls[0];
            expect(flagKey).toBe("test-flag");
            expect(body).toEqual({
                company: { id: "comp-1" },
                preflight: { usage: 5, creditCost: { "credit-1": 20 } },
            });

            await client.close();
        });

        it("rounds a fractional usage up on the wire", async () => {
            apiAllows(true);

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
            });

            await client.checkFlag({ company: { id: "comp-1" } }, "test-flag", { usage: 2.4 });
            await client.checkFlag({ company: { id: "comp-1" } }, "test-flag", {
                eventUsage: { eventSubtype: "tokens", quantity: 0.2 },
            });

            expect(mockCheckFlag.mock.calls[0][1].preflight).toEqual({ usage: 3 });
            expect(mockCheckFlag.mock.calls[1][1].preflight).toEqual({
                eventUsage: { eventSubtype: "tokens", quantity: 1 },
            });

            await client.close();
        });

        it("lets the options' usage knobs replace the eval context's, keeping its credit cost", async () => {
            apiAllows(true);

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
            });

            await client.checkFlag(
                {
                    company: { id: "comp-1" },
                    preflight: { usage: 5, creditCost: { "credit-1": 20 } },
                },
                "test-flag",
                { eventUsage: { eventSubtype: "tokens", quantity: 9 } },
            );

            expect(mockCheckFlag.mock.calls[0][1].preflight).toEqual({
                creditCost: { "credit-1": 20 },
                eventUsage: { eventSubtype: "tokens", quantity: 9 },
            });

            await client.close();
        });

        it("keeps the eval context's usage when the options only price the action", async () => {
            apiAllows(true);

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
            });

            await client.checkFlag({ company: { id: "comp-1" }, preflight: { usage: 5 } }, "test-flag", {
                creditCost: { "credit-1": 20 },
            });

            expect(mockCheckFlag.mock.calls[0][1].preflight).toEqual({
                creditCost: { "credit-1": 20 },
                usage: 5,
            });

            await client.close();
        });

        it("sends no preflight for a zero usage, and caches the check", async () => {
            apiAllows(true);
            const cacheProvider = newCacheProvider();

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [cacheProvider] },
                logger: mockLogger,
            });

            await client.checkFlag({ company: { id: "comp-1" } }, "test-flag", {
                usage: 0,
                eventUsage: { eventSubtype: "tokens", quantity: 0 },
            });

            expect(mockCheckFlag.mock.calls[0][1]).toEqual({ company: { id: "comp-1" } });
            expect(cacheProvider.get).toHaveBeenCalledTimes(1);
            expect(cacheProvider.set).toHaveBeenCalledTimes(1);

            await client.close();
        });

        it("warns and drops a quantity the server would reject", async () => {
            apiAllows(true);

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
            });

            await client.checkFlag({ company: { id: "comp-1" } }, "test-flag", { usage: Number.NaN });

            expect(mockCheckFlag.mock.calls[0][1]).toEqual({ company: { id: "comp-1" } });
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("not a usable quantity"));

            await client.close();
        });

        it("does not answer a preflighted check from a cached plain verdict, or cache its own", async () => {
            apiAllows(false);
            const cacheProvider = newCacheProvider({
                flagKey: "test-flag",
                reason: "match",
                value: true,
            });

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [cacheProvider] },
                logger: mockLogger,
            });

            const result = await client.checkFlag({ company: { id: "comp-1" } }, "test-flag", { usage: 5 });

            expect(result).toBe(false);
            expect(cacheProvider.get).not.toHaveBeenCalled();
            expect(cacheProvider.set).not.toHaveBeenCalled();
            expect(mockCheckFlag).toHaveBeenCalledTimes(1);

            await client.close();
        });

        it("still caches a plain check", async () => {
            apiAllows(true);
            const cacheProvider = newCacheProvider();

            const client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [cacheProvider] },
                logger: mockLogger,
            });

            await client.checkFlag({ company: { id: "comp-1" } }, "test-flag");

            expect(cacheProvider.get).toHaveBeenCalledTimes(1);
            expect(cacheProvider.set).toHaveBeenCalledTimes(1);
            expect(mockCheckFlag.mock.calls[0][1]).toEqual({ company: { id: "comp-1" } });

            await client.close();
        });
    });

    describe("DataStream preflight", () => {
        const streamAllows = (value: boolean): void => {
            mockDataStream.checkFlag.mockResolvedValue({ value, flagKey: "test-flag", reason: "match" });
        };

        const newClient = () =>
            new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: { flagChecks: [] },
                logger: mockLogger,
                useDataStream: true,
            });

        it("hands the local engine a preflight the eval context carries", async () => {
            streamAllows(true);
            const client = newClient();

            await client.checkFlag({ company: { id: "comp-1" }, preflight: { usage: 7 } }, "test-flag");

            expect(mockDataStream.checkFlag.mock.calls[0][2]).toEqual(
                expect.objectContaining({ usage: 7, eventUsage: undefined }),
            );

            await client.close();
        });

        it("lets the options' usage knobs replace the eval context's for the local engine", async () => {
            streamAllows(true);
            const client = newClient();

            await client.checkFlag(
                { company: { id: "comp-1" }, preflight: { usage: 7, creditCost: { "credit-1": 20 } } },
                "test-flag",
                { eventUsage: { eventSubtype: "tokens", quantity: 9 } },
            );

            expect(mockDataStream.checkFlag.mock.calls[0][2]).toEqual(
                expect.objectContaining({
                    creditCost: { "credit-1": 20 },
                    eventUsage: { eventSubtype: "tokens", quantity: 9 },
                    usage: undefined,
                }),
            );

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
            creditLeases: { mode: "client" },
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
            creditLeases: { mode: "client" },
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
            creditLeases: { mode: "client" },
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
            creditLeases: { mode: "client" },
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

    it("close() releases a lease an in-flight prewarm installs", async () => {
        // The prewarm's acquire is on the wire when close() starts. Promises
        // are not cancellable, so the lease still lands: close has to drain it
        // before listing the store, or nothing releases it and the credits
        // stay held until server-side expiry.
        let landAcquire!: () => void;
        const acquireLanded = new Promise<void>((r) => {
            landAcquire = r;
        });
        let onTheWire!: () => void;
        const reachedTheWire = new Promise<void>((r) => {
            onTheWire = r;
        });
        mockAcquireCreditLease.mockImplementation(async () => {
            onTheWire();
            await acquireLanded;
            return {
                data: {
                    id: "lse_1",
                    companyId: "comp_1",
                    creditTypeId: "bilcr_inference",
                    grantedAmount: 1000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                },
                params: {},
            };
        });
        mockReleaseCreditLease.mockResolvedValue({});

        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            creditLeases: { mode: "client", sweepIntervalMs: 60_000 },
        });
        await client.identify(
            { keys: { user_id: "u_1" }, company: { keys: { id: "comp_1" } } },
            {
                prewarm: ["bilcr_inference"],
            },
        );
        await reachedTheWire;

        const closing = client.close();
        // An untracked acquire would install here, behind the release.
        landAcquire();
        await closing;

        const leaseStore = (client as any).leaseStore;
        expect(leaseStore.list()).toEqual([]);
        expect(mockReleaseCreditLease).toHaveBeenCalledWith("lse_1", {});
    });

    it("close() returns within the shutdown budget when a release never lands", async () => {
        mockReleaseCreditLease.mockReturnValue(new Promise(() => {}));
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            creditLeases: { mode: "client", sweepIntervalMs: 60_000 },
        });
        // biome-ignore lint/suspicious/noExplicitAny: reaching into the client's store
        const leaseStore = (client as any).leaseStore;
        await leaseStore.replace({
            leaseId: "lse_1",
            companyId: "co_1",
            creditTypeId: "ct_1",
            grantedAmount: 1000,
            expiresAt: new Date(Date.now() + 5 * 60_000),
        });

        jest.useFakeTimers();
        try {
            const closing = client.close();
            await jest.advanceTimersByTimeAsync(SHUTDOWN_DRAIN_TIMEOUT_MS + 10);
            await closing;
        } finally {
            jest.useRealTimers();
        }

        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining("releasing credit leases on close"));
        // `clearAllMocks` keeps implementations, so hand the next test a
        // release that resolves.
        mockReleaseCreditLease.mockResolvedValue({});
    });

    it("prewarm() called after close() has started acquires nothing", async () => {
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            creditLeases: { mode: "client", sweepIntervalMs: 60_000 },
        });
        await client.close();

        await client.prewarm({ company: { id: "co_1" } }, ["bilcr_inference"]);

        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
    });

    it("close() cuts short a prewarm still polling for its company", async () => {
        // The poll waits out prewarmResolveTimeoutMs on a company that never
        // surfaces. Its timer is unref'd and the loop reads the closing flag,
        // so close() neither hangs on it nor leaves a handle behind.
        mockDataStream.getCachedCompany.mockResolvedValue(null);
        mockDataStream.getCompany.mockResolvedValue(null);
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            useDataStream: true,
            creditLeases: { mode: "client", sweepIntervalMs: 60_000, prewarmResolveTimeoutMs: 60_000 },
        });

        const prewarming = client.prewarm({ company: { key: "co-1" } }, ["bilcr_inference"]);
        // Let the poll get past its first attempt and into the sleep.
        await new Promise((r) => setTimeout(r, 150));

        const startedClosing = Date.now();
        await client.close();
        await prewarming;

        expect(Date.now() - startedClosing).toBeLessThan(1000);
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
    });

    describe("company resolution", () => {
        beforeEach(() => {
            // `clearAllMocks` keeps implementations, so put the wire calls back
            // to a healthy server after the tests above rewire them.
            mockAcquireCreditLease.mockResolvedValue({
                data: {
                    id: "lse_1",
                    companyId: "comp_real",
                    creditTypeId: "bilcr_inference",
                    grantedAmount: 1000,
                    expiresAt: new Date(Date.now() + 5 * 60_000),
                },
                params: {},
            });
            mockReleaseCreditLease.mockResolvedValue({});
        });

        const newClient = () =>
            new SchematicClient({
                apiKey: "test-key",
                logger: mockLogger,
                useDataStream: true,
                creditLeases: { mode: "client", sweepIntervalMs: 60_000, prewarmResolveTimeoutMs: 0 },
            });

        it("resolves an account-defined `id` key through the cache", async () => {
            // The account's own identifier happens to live under a key named
            // `id`. It is an ordinary entity key, so the lookup decides.
            mockDataStream.getCachedCompany.mockResolvedValue({ id: "comp_real" });
            const client = newClient();

            await client.prewarm({ company: { id: "acme" } }, ["bilcr_inference"]);

            expect(mockDataStream.getCachedCompany).toHaveBeenCalledWith({ id: "acme" });
            expect(mockAcquireCreditLease).toHaveBeenCalledWith(
                expect.objectContaining({ companyId: "comp_real" }),
                undefined,
            );

            await client.close();
        });

        it("falls back to a comp_-prefixed value when the keys resolve nothing", async () => {
            mockDataStream.getCachedCompany.mockResolvedValue(null);
            const client = newClient();

            await client.prewarm({ company: { account_id: "comp_1" } }, ["bilcr_inference"]);

            expect(mockAcquireCreditLease).toHaveBeenCalledWith(
                expect.objectContaining({ companyId: "comp_1" }),
                undefined,
            );

            await client.close();
        });

        it("resolves nothing when the keys miss and carry no schematic id", async () => {
            mockDataStream.getCachedCompany.mockResolvedValue(null);
            const client = newClient();

            await client.prewarm({ company: { id: "acme" } }, ["bilcr_inference"]);

            expect(mockAcquireCreditLease).not.toHaveBeenCalled();

            await client.close();
        });
    });
});

describe("SchematicClient wrapper - server-mode credit reservations", () => {
    const mockLogger = {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    };

    function reserveResponse() {
        return {
            data: {
                flag: "inference",
                flagId: "flag_1",
                value: true,
                reason: "matched",
                reservation: {
                    id: "rsv_1",
                    companyId: "co_1",
                    creditTypeId: "bilcr_inference",
                    consumptionRate: 10,
                    creditsReserved: 500,
                    quantityReserved: 50,
                    eventSubtype: "inference_tokens",
                    expiresAt: new Date(Date.now() + 60_000),
                },
            },
            params: {},
        };
    }

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("falls back to the server path when DataStream fails to start at runtime", async () => {
        // `auto` resolves per check, so a DataStream that rejected its start
        // after construction must land on check-and-reserve rather than an
        // ungated plain check.
        mockDataStream.start.mockRejectedValue(new Error("websocket handshake failed"));
        mockCheckAndReserveFlag.mockResolvedValue(reserveResponse());

        const client = new SchematicClient({
            apiKey: "test-key",
            useDataStream: true,
            logger: mockLogger,
            creditLeases: { mode: "auto", sweepIntervalMs: 60_000 },
        });
        // Let the rejected start() clear the datastream client.
        await new Promise((r) => setImmediate(r));

        const result = await client.check({ company: { id: "co_1" } }, "inference", {
            usage: 50,
            eventSubtype: "inference_tokens",
        });

        expect(mockCheckAndReserveFlag).toHaveBeenCalledTimes(1);
        expect(mockAcquireCreditLease).not.toHaveBeenCalled();
        expect(mockCheckFlag).not.toHaveBeenCalled();
        expect(result.allowed).toBe(true);
        expect(result.reservation?.mode).toBe("server");

        await client.close();
    });

    it("clamps an oversized reservation TTL to the API maximum, less room for clock skew", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(reserveResponse());
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            creditLeases: { mode: "server", defaultReservationTTL: 4 * 60 * 60 * 1000 },
        });

        const maxTTL = MAX_RESERVATION_TTL_MS - RESERVATION_TTL_SKEW_ALLOWANCE_MS;
        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`clamped to ${maxTTL}ms`));

        const before = Date.now();
        await client.check({ company: { id: "co_1" } }, "inference", { usage: 50 });
        const after = Date.now();

        // The API measures the cap against its own clock, so the hold has to
        // land under it even when this client runs ahead.
        const expiresAt = (mockCheckAndReserveFlag.mock.calls[0][1].expiresAt as Date).getTime();
        expect(expiresAt).toBeGreaterThanOrEqual(before + maxTTL);
        expect(expiresAt).toBeLessThanOrEqual(after + maxTTL);

        await client.close();
    });

    it("leaves the TTL alone in client mode, where the API never sees it", async () => {
        const ttl = 2 * 60 * 60 * 1000;
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            creditLeases: { mode: "client", defaultReservationTTL: ttl, sweepIntervalMs: 60_000 },
        });

        // Client mode sizes the local sweep with this value and never sends it
        // to the API, so neither the clamp nor its warning applies.
        expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining("clamped"));
        // biome-ignore lint/suspicious/noExplicitAny: introspect the resolved lease config
        const resolved = (client as any).creditLeaseManager.resolveConfig("bilcr_inference");
        expect(resolved.reservationTTL).toBe(ttl);

        await client.close();
    });

    it("leaves a reservation TTL under the maximum alone", async () => {
        mockCheckAndReserveFlag.mockResolvedValue(reserveResponse());
        const ttl = 120_000;
        const client = new SchematicClient({
            apiKey: "test-key",
            logger: mockLogger,
            creditLeases: { mode: "server", defaultReservationTTL: ttl },
        });

        const before = Date.now();
        await client.check({ company: { id: "co_1" } }, "inference", { usage: 50 });
        const after = Date.now();

        expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining("defaultReservationTTL"));
        const expiresAt = (mockCheckAndReserveFlag.mock.calls[0][1].expiresAt as Date).getTime();
        expect(expiresAt).toBeGreaterThanOrEqual(before + ttl);
        expect(expiresAt).toBeLessThanOrEqual(after + ttl);

        await client.close();
    });
});
