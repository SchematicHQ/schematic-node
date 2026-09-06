import * as fs from "fs";
import * as path from "path";
import { DataStreamClient } from "../../../src/datastream/datastream-client";
import { RedisCacheProvider } from "../../../src/cache/redis";
import { LocalCache } from "../../../src/cache/local";

// The websocket and rules engine are not exercised here; the constructor
// still wires them up.
jest.mock("../../../src/datastream/websocket-client", () => ({
  DatastreamWSClient: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    start: jest.fn(),
    close: jest.fn(),
    isConnected: jest.fn().mockReturnValue(false),
    isReady: jest.fn().mockReturnValue(false),
    sendMessage: jest.fn(),
  })),
}));
jest.mock("../../../src/rules-engine", () => ({
  RulesEngineClient: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    isInitialized: jest.fn().mockReturnValue(false),
    getVersionKey: jest.fn().mockReturnValue("1"),
  })),
}));

// Copy of schematic-replicator/testdata/redis_key_layout.json: the keys the
// replicator writes. In replicator mode this SDK reads them, so the Redis
// provider prefix plus the datastream key must reproduce them exactly. The C#
// and Ruby SDKs doubled the prefix for a year with no test on either side
// (SCH-7070); this is that test.
interface Fixture {
  prefix: string;
  cases: { kind: string; input: Record<string, string>; key: string }[];
}

const CACHE_VERSION = "v-test";

describe("replicator Redis key layout", () => {
  const fixture: Fixture = JSON.parse(
    fs.readFileSync(path.join(__dirname, "redis_key_layout.json"), "utf8"),
  );
  const redis = new RedisCacheProvider<string>({
    client: {} as never,
    keyPrefix: `${fixture.prefix}:`,
  });
  const fullKey = (key: string): string =>
    (redis as unknown as { getFullKey(k: string): string }).getFullKey(key);

  let client: DataStreamClient;
  beforeAll(() => {
    client = new DataStreamClient({
      apiKey: "test-api-key",
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      replicatorMode: true,
      replicatorHealthURL: "http://localhost:8090/ready",
      // Replicator mode insists on shared caches; the key builders do not use them.
      companyCache: new LocalCache(),
      userCache: new LocalCache(),
      flagCache: new LocalCache(),
    });
    // Set by the replicator health response in production.
    (
      client as unknown as { replicatorCacheVersion: string }
    ).replicatorCacheVersion = CACHE_VERSION;
  });
  afterAll(() => {
    client?.removeAllListeners();
    client?.close();
  });

  test.each(fixture.cases.map((c) => [c.kind, c]))("%s", (_kind, c) => {
    const priv = client as unknown as {
      flagCacheKey(key: string): string;
      resourceIdCacheKey(type: string, id: string): string;
      resourceKeyToCacheKey(type: string, key: string, value: string): string;
    };
    let key: string;
    switch (c.kind) {
      case "flag":
        key = priv.flagCacheKey(c.input.key);
        break;
      case "company_id":
        key = priv.resourceIdCacheKey("company", c.input.id);
        break;
      case "company_lookup":
        key = priv.resourceKeyToCacheKey("company", c.input.key, c.input.value);
        break;
      case "user_id":
        key = priv.resourceIdCacheKey("user", c.input.id);
        break;
      case "user_lookup":
        key = priv.resourceKeyToCacheKey("user", c.input.key, c.input.value);
        break;
      default:
        throw new Error(`fixture case kind ${c.kind} has no builder here`);
    }
    expect(fullKey(key)).toBe(c.key.replace("<VERSION>", CACHE_VERSION));
  });
});
