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

            const result = await client.checkFlag(
                { company: { id: "comp-1" } },
                "test-flag",
            );

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

            const result = await client.checkFlag(
                { company: { id: "comp-1" } },
                "test-flag",
            );

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

            await client.checkFlag(
                { company: { id: "comp-1" } },
                "test-flag",
            );
            await client.checkFlag(
                { company: { id: "comp-2" } },
                "test-flag",
            );

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

            const result1 = await client.checkFlag(
                { company: { id: "comp-1" } },
                "test-flag",
            );
            const result2 = await client.checkFlag(
                { company: { id: "comp-1" } },
                "test-flag",
            );

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

            await client.identify(
                { keys: { id: "user-1" }, name: "Test User" },
                { idempotencyKey: "dedupe-xyz" },
            );

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
});