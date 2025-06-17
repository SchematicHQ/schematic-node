import { CloudflareKVCache } from "./kv";
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the KVNamespace interface
class MockKVNamespace {
  private storage: Map<string, { value: string; expirationTimestamp?: number }> = new Map();

  async get(key: string, type: 'json' | 'text' | 'arrayBuffer' | 'stream' = 'text'): Promise<any> {
    const entry = this.storage.get(key);
    
    // Check if entry exists and is not expired
    if (!entry || (entry.expirationTimestamp && entry.expirationTimestamp < Date.now())) {
      return null;
    }
    
    if (type === 'json') {
      return JSON.parse(entry.value);
    }
    return entry.value;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    let expirationTimestamp: number | undefined = undefined;
    if (options?.expirationTtl) {
      expirationTimestamp = Date.now() + (options.expirationTtl * 1000);
    }
    this.storage.set(key, { value, expirationTimestamp });
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }> {
    const keys = [...this.storage.keys()]
      .filter(key => !options?.prefix || key.startsWith(options.prefix))
      .map(name => ({ name }));
    
    return { keys };
  }
}

describe("CloudflareKVCache", () => {
  let kvNamespace: MockKVNamespace;
  let cache: CloudflareKVCache<any>;
  
  beforeEach(() => {
    // Create a fresh KV namespace mock for each test
    kvNamespace = new MockKVNamespace();
    cache = new CloudflareKVCache(kvNamespace as any);
  });

  describe("constructor", () => {
    it("should use default options when none provided", () => {
      const defaultCache = new CloudflareKVCache(kvNamespace as any);
      // Using private access to verify internal state (for testing purposes only)
      expect((defaultCache as any).keyPrefix).toBe("schematic:");
      expect((defaultCache as any).defaultTTL).toBe(5000);
    });

    it("should use custom options when provided", () => {
      const customCache = new CloudflareKVCache(kvNamespace as any, {
        keyPrefix: "custom:",
        ttl: 10000
      });
      expect((customCache as any).keyPrefix).toBe("custom:");
      expect((customCache as any).defaultTTL).toBe(10000);
    });
  });

  describe("get", () => {
    it("should return undefined for non-existent key", async () => {
      const result = await cache.get("nonexistent-key");
      expect(result).toBeUndefined();
    });

    it("should return value for existing key", async () => {
      const testData = { test: "data" };
      await kvNamespace.put("schematic:test-key", JSON.stringify(testData));
      
      const result = await cache.get("test-key");
      expect(result).toEqual(testData);
    });

    it("should return undefined for expired keys", async () => {
      const testData = { test: "data" };
      // Add an entry that's already expired (expirationTtl of 0)
      await kvNamespace.put("schematic:expired-key", JSON.stringify(testData), { expirationTtl: -1 });
      
      // Fake the expiration check (KV would normally handle this internally)
      jest.spyOn(kvNamespace, "get").mockResolvedValueOnce(null);
      
      const result = await cache.get("expired-key");
      expect(result).toBeUndefined();
    });
  });

  describe("set", () => {
    it("should store value in KV with default TTL", async () => {
      const testData = { test: "data" };
      const spy = jest.spyOn(kvNamespace, "put");
      
      await cache.set("test-key", testData);
      
      expect(spy).toHaveBeenCalledWith(
        "schematic:test-key",
        JSON.stringify(testData),
        { expirationTtl: 60 }  // Minimum 60s in Cloudflare KV
      );
    });

    it("should use custom TTL when provided", async () => {
      const testData = { test: "data" };
      const spy = jest.spyOn(kvNamespace, "put");
      const customTTL = 120000; // 120 seconds in ms
      
      await cache.set("test-key", testData, customTTL);
      
      expect(spy).toHaveBeenCalledWith(
        "schematic:test-key",
        JSON.stringify(testData),
        { expirationTtl: 120 }
      );
    });
  });

  describe("delete", () => {
    it("should remove key from KV store", async () => {
      const testData = { test: "data" };
      await kvNamespace.put("schematic:test-key", JSON.stringify(testData));
      
      const spy = jest.spyOn(kvNamespace, "delete");
      await cache.delete("test-key");
      
      expect(spy).toHaveBeenCalledWith("schematic:test-key");
      
      const result = await cache.get("test-key");
      expect(result).toBeUndefined();
    });
  });

  describe("deleteAllExcept", () => {
    it("should delete all keys except those specified", async () => {
      // Set up multiple keys
      await kvNamespace.put("schematic:key1", JSON.stringify({ data: 1 }));
      await kvNamespace.put("schematic:key2", JSON.stringify({ data: 2 }));
      await kvNamespace.put("schematic:key3", JSON.stringify({ data: 3 }));
      
      // Keep key2
      await cache.deleteAllExcept(["key2"]);
      
      // Verify key2 is retained and others are removed
      expect(await cache.get("key1")).toBeUndefined();
      expect(await cache.get("key2")).toEqual({ data: 2 });
      expect(await cache.get("key3")).toBeUndefined();
    });
    
    it("should handle empty keysToKeep array", async () => {
      // Set up multiple keys
      await kvNamespace.put("schematic:key1", JSON.stringify({ data: 1 }));
      await kvNamespace.put("schematic:key2", JSON.stringify({ data: 2 }));
      
      // Delete all
      await cache.deleteAllExcept([]);
      
      // Verify all are gone
      expect(await cache.get("key1")).toBeUndefined();
      expect(await cache.get("key2")).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("should remove all keys with the configured prefix", async () => {
      // Set up multiple keys with different prefixes
      await kvNamespace.put("schematic:key1", JSON.stringify({ data: 1 }));
      await kvNamespace.put("schematic:key2", JSON.stringify({ data: 2 }));
      await kvNamespace.put("other:key3", JSON.stringify({ data: 3 }));
      
      await cache.clear();
      
      // Verify only schematic: prefixed keys are removed
      expect(await kvNamespace.get("schematic:key1")).toBeNull();
      expect(await kvNamespace.get("schematic:key2")).toBeNull();
      expect(await kvNamespace.get("other:key3")).not.toBeNull();
    });
    
    it("should handle empty cache", async () => {
      const listSpy = jest.spyOn(kvNamespace, "list");
      
      await cache.clear();
      
      expect(listSpy).toHaveBeenCalledWith({ prefix: "schematic:" });
    });
  });

  describe("getFullKey", () => {
    it("should apply prefix to key", () => {
      // Test the private method using type assertion
      const fullKey = (cache as any).getFullKey("test-key");
      expect(fullKey).toBe("schematic:test-key");
    });
    
    it("should work with custom prefix", () => {
      const customCache = new CloudflareKVCache(kvNamespace as any, {
        keyPrefix: "custom:"
      });
      const fullKey = (customCache as any).getFullKey("test-key");
      expect(fullKey).toBe("custom:test-key");
    });
  });
});
