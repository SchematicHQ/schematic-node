/* eslint @typescript-eslint/no-explicit-any: 0 */

import { SchematicClient } from "../src/wrapper";
import { CacheProvider } from "../src/cache";
import { Logger } from "../src/logger";

jest.useFakeTimers();

class ThrowOnWriteCacheProvider implements CacheProvider<boolean> {
    async get(): Promise<boolean | undefined> {
        return undefined;
    }
    async set(): Promise<void> {
        throw new Error("429 Too Many Requests");
    }
}

class ThrowOnReadCacheProvider implements CacheProvider<boolean> {
    async get(): Promise<boolean | undefined> {
        throw new Error("cache read failure");
    }
    async set(): Promise<void> {
        // no-op
    }
}

function createMockLogger(): jest.Mocked<Logger> {
    return {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    };
}

function mockFeatures(client: SchematicClient, mock: Record<string, jest.Mock>): void {
    Object.defineProperty(client, "features", {
        value: mock,
        writable: true,
        configurable: true,
    });
}

describe("SchematicClient cache provider error handling", () => {
    let mockLogger: jest.Mocked<Logger>;
    let client: SchematicClient;

    beforeEach(() => {
        mockLogger = createMockLogger();
    });

    afterEach(async () => {
        if (client) {
            await client.close();
        }
    });

    describe("checkFlag", () => {
        it("should return API value when cache provider throws on set()", async () => {
            client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: {
                    flagChecks: [new ThrowOnWriteCacheProvider()],
                },
                logger: mockLogger,
            });

            mockFeatures(client, {
                checkFlag: jest.fn().mockResolvedValue({
                    data: { value: true },
                }),
            });

            const result = await client.checkFlag({}, "api_enabled");

            expect(result).toBe(true);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Cache write error"),
            );
        });

        it("should fall through to API when cache provider throws on get()", async () => {
            client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: {
                    flagChecks: [new ThrowOnReadCacheProvider()],
                },
                logger: mockLogger,
            });

            mockFeatures(client, {
                checkFlag: jest.fn().mockResolvedValue({
                    data: { value: true },
                }),
            });

            const result = await client.checkFlag({}, "api_enabled");

            expect(result).toBe(true);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Cache read error"),
            );
        });

        it("should skip failing provider and use next provider on read", async () => {
            const workingProvider: CacheProvider<boolean> = {
                get: jest.fn().mockResolvedValue(true),
                set: jest.fn(),
            };

            client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: {
                    flagChecks: [new ThrowOnReadCacheProvider(), workingProvider],
                },
                logger: mockLogger,
            });

            const result = await client.checkFlag({}, "my_flag");

            expect(result).toBe(true);
            expect(workingProvider.get).toHaveBeenCalled();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Cache read error"),
            );
        });

        it("should still write to working providers when one provider throws on set()", async () => {
            const workingProvider: CacheProvider<boolean> = {
                get: jest.fn().mockResolvedValue(undefined),
                set: jest.fn(),
            };

            client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: {
                    flagChecks: [new ThrowOnWriteCacheProvider(), workingProvider],
                },
                logger: mockLogger,
            });

            mockFeatures(client, {
                checkFlag: jest.fn().mockResolvedValue({
                    data: { value: true },
                }),
            });

            const result = await client.checkFlag({}, "my_flag");

            expect(result).toBe(true);
            expect(workingProvider.set).toHaveBeenCalled();
        });
    });

    describe("checkFlags", () => {
        it("should return API values when cache provider throws on set()", async () => {
            client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: {
                    flagChecks: [new ThrowOnWriteCacheProvider()],
                },
                logger: mockLogger,
            });

            mockFeatures(client, {
                checkFlags: jest.fn().mockResolvedValue({
                    data: {
                        flags: [
                            { flag: "flag_a", value: true, reason: "matched" },
                            { flag: "flag_b", value: false, reason: "no match" },
                        ],
                    },
                }),
            });

            const results = await client.checkFlags({}, ["flag_a", "flag_b"]);

            expect(results).toHaveLength(2);
            expect(results[0].value).toBe(true);
            expect(results[1].value).toBe(false);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Cache write error"),
            );
        });

        it("should fall through to API when cache provider throws on get()", async () => {
            client = new SchematicClient({
                apiKey: "test-api-key",
                cacheProviders: {
                    flagChecks: [new ThrowOnReadCacheProvider()],
                },
                logger: mockLogger,
            });

            mockFeatures(client, {
                checkFlags: jest.fn().mockResolvedValue({
                    data: {
                        flags: [
                            { flag: "flag_a", value: true, reason: "matched" },
                        ],
                    },
                }),
            });

            const results = await client.checkFlags({}, ["flag_a"]);

            expect(results).toHaveLength(1);
            expect(results[0].value).toBe(true);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining("Cache read error"),
            );
        });
    });
});
