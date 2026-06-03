import { CacheProvider, CacheOptions } from "./types";

/**
 * Minimal interface describing the redis client methods used by the SDK.
 * Compatible with the 'redis' package's RedisClientType (node-redis v4).
 *
 * Includes hash + sorted-set + eval surface used by the credit-lease and
 * reservation stores to coordinate state across multiple SDK pods.
 */
export interface RedisClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<unknown>;
    setEx(key: string, seconds: number, value: string): Promise<unknown>;
    del(key: string | string[]): Promise<unknown>;
    scanIterator(options: { MATCH: string; COUNT: number }): AsyncIterable<string>;
    // Hash ops — used to store lease + reservation state as a single field-set
    // so partial updates (e.g. atomic decrement on localRemainingCredits) don't
    // step on neighboring fields.
    hSet(key: string, field: string | Record<string, string | number>, value?: string | number): Promise<unknown>;
    hGet(key: string, field: string): Promise<string | null | undefined>;
    hGetAll(key: string): Promise<Record<string, string>>;
    hDel(key: string, field: string | string[]): Promise<unknown>;
    // Sorted-set ops — used to index reservations by expiry timestamp so the
    // sweeper can pop expired entries in O(log n).
    zAdd(key: string, members: { score: number; value: string } | { score: number; value: string }[]): Promise<unknown>;
    zRangeByScore(
        key: string,
        min: number | string,
        max: number | string,
        options?: { LIMIT: { offset: number; count: number } },
    ): Promise<string[]>;
    zRem(key: string, member: string | string[]): Promise<unknown>;
    zCard(key: string): Promise<number>;
    // Lua scripts — used for the single-key atomic primitives (check-and-decrement
    // on lease balance, claim-and-delete on a reservation). Kept single-key so
    // they're safe under Redis Cluster (a multi-key EVAL whose keys span slots
    // raises CROSSSLOT).
    eval(script: string, options: { keys: string[]; arguments: string[] }): Promise<unknown>;
    // Expiry on a millisecond-precision absolute timestamp — used to auto-clean
    // lease + reservation rows shortly after their declared expiry.
    pExpireAt(key: string, timestamp: number): Promise<unknown>;
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
        this.keyPrefix = options.keyPrefix || "schematic:";
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
        const pattern = options?.scanPattern ? this.keyPrefix + options.scanPattern : this.keyPrefix + "*";
        const fullKeysToKeep = new Set(keysToKeep.map((k) => this.getFullKey(k)));
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
