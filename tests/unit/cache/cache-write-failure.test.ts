import { SchematicClient } from "../../../src/wrapper";
import type { CacheProvider } from "../../../src/cache";
import type { CheckFlagWithEntitlementResponse } from "../../../src/wrapper";

/**
 * A cache provider that always throws on set() to simulate failures
 * like Cloudflare KV 429 Too Many Requests.
 */
class FailingCacheProvider implements CacheProvider<CheckFlagWithEntitlementResponse> {
    async get(): Promise<CheckFlagWithEntitlementResponse | null> {
        return null; // Always miss
    }
    async set(): Promise<void> {
        throw new Error("429 Too Many Requests");
    }
    async delete(): Promise<void> {}
}

// Mock the features.checkFlag API call
jest.mock("../../../src/Client", () => {
    class MockBaseClient {
        features = {
            checkFlag: jest.fn().mockResolvedValue({
                data: {
                    value: true,
                    flag: "test-flag",
                    reason: "match",
                    companyId: "comp-1",
                },
            }),
            checkFlags: jest.fn().mockResolvedValue({
                data: {
                    flags: [
                        {
                            value: true,
                            flag: "test-flag",
                            reason: "match",
                            companyId: "comp-1",
                        },
                    ],
                },
            }),
        };
        events = {};
    }
    return { SchematicClient: MockBaseClient };
});

// Mock the EventBuffer to avoid side effects
jest.mock("../../../src/events", () => {
    return {
        EventBuffer: jest.fn().mockImplementation(() => ({
            push: jest.fn(),
            stop: jest.fn().mockResolvedValue(undefined),
        })),
    };
});

describe("Cache write failure should not discard API result", () => {
    let client: SchematicClient;
    const warnSpy = jest.fn();

    beforeEach(() => {
        client = new SchematicClient({
            apiKey: "test-api-key",
            cacheProviders: {
                flagChecks: [new FailingCacheProvider()],
            },
            logger: {
                error: jest.fn(),
                warn: warnSpy,
                info: jest.fn(),
                debug: jest.fn(),
            },
        });
    });

    afterEach(async () => {
        await client.close();
    });

    it("checkFlag returns the API value even when cache set() throws", async () => {
        const result = await client.checkFlag({ company: { id: "comp-1" } }, "test-flag");
        expect(result).toBe(true);
    });

    it("checkFlagWithEntitlement returns the API value even when cache set() throws", async () => {
        const result = await client.checkFlagWithEntitlement({ company: { id: "comp-1" } }, "test-flag");
        expect(result.value).toBe(true);
        expect(result.reason).toBe("match");
    });

    it("logs a warning when cache write fails", async () => {
        await client.checkFlag({ company: { id: "comp-1" } }, "test-flag");
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("Cache write failed for flag test-flag"),
        );
    });

    it("checkFlags returns API values even when cache set() throws", async () => {
        const results = await client.checkFlags({ company: { id: "comp-1" } }, ["test-flag"]);
        expect(results).toHaveLength(1);
        expect(results[0].value).toBe(true);
    });
});
