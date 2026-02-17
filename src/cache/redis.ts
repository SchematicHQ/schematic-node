import { CacheProvider, CacheOptions } from "./types";

/**
 * Minimal interface describing the redis client methods used by RedisCacheProvider.
 * Compatible with the 'redis' package's RedisClientType.
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  setEx(key: string, seconds: number, value: string): Promise<unknown>;
  del(key: string | string[]): Promise<unknown>;
  scanIterator(options: { MATCH: string; COUNT: number }): AsyncIterable<string>;
}

export interface RedisOptions extends CacheOptions {
  /** Pre-created, connected redis client */
  client: RedisClient;
  /** Redis key prefix for all cache keys (default: 'schematic:') */
  keyPrefix?: string;
}

/**
 * Redis-based cache provider implementation
 * Accepts a pre-created redis client (e.g. from the 'redis' package)
 */
export class RedisCacheProvider<T> implements CacheProvider<T> {
  private client: RedisClient;
  private defaultTTL: number;
  private keyPrefix: string;

  constructor(options: RedisOptions) {
    this.client = options.client;
    this.defaultTTL = Math.floor((options.ttl || 5000) / 1000); // Convert to seconds for Redis
    this.keyPrefix = options.keyPrefix || 'schematic:';
  }

  private getFullKey(key: string): string {
    return this.keyPrefix + key;
  }

  async get(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const value = await this.client.get(fullKey);

    if (value === null) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.getFullKey(key);
    const serializedValue = JSON.stringify(value);
    const actualTTL = ttl ? Math.floor(ttl / 1000) : this.defaultTTL;

    if (actualTTL > 0) {
      await this.client.setEx(fullKey, actualTTL, serializedValue);
    } else {
      await this.client.set(fullKey, serializedValue);
    }
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);
    await this.client.del(fullKey);
  }

  async deleteMissing(keysToKeep: string[], options?: { scanPattern?: string }): Promise<void> {
    // Get all keys with our prefix using SCAN (non-blocking)
    // Allow more specific pattern to reduce keys scanned (e.g., 'flag:*' to only scan flag keys)
    const pattern = options?.scanPattern
      ? this.keyPrefix + options.scanPattern
      : this.keyPrefix + '*';
    const fullKeysToKeep = new Set(keysToKeep.map(k => this.getFullKey(k)));
    const keysToDelete: string[] = [];
    const batchSize = 1000;

    for await (const key of this.client.scanIterator({ MATCH: pattern, COUNT: 1000 })) {
      if (!fullKeysToKeep.has(key)) {
        keysToDelete.push(key);

        // Delete in batches to avoid memory buildup with millions of keys
        if (keysToDelete.length >= batchSize) {
          await this.client.del(keysToDelete);
          keysToDelete.length = 0; // Clear array
        }
      }
    }

    // Delete remaining keys
    if (keysToDelete.length > 0) {
      await this.client.del(keysToDelete);
    }
  }
}
