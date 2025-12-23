import { setTimeout, clearTimeout } from "timers";
import { CacheProvider, CacheOptions } from "./types";

type CacheItem<T> = {
    value: T;
    accessCounter: number;
    expiration: number;
    timeoutId?: ReturnType<typeof setTimeout>;
};

/**
 * In-memory cache implementation with LRU eviction and TTL support
 */
class LocalCache<T> implements CacheProvider<T> {
    private cache: Map<string, CacheItem<T>>;
    private maxItems: number;
    private accessCounter: number = 0;
    private defaultTTL: number;

    constructor({ maxItems = 1000, ttl = 5000 }: CacheOptions = {}) {
        this.cache = new Map();
        this.maxItems = maxItems;
        this.defaultTTL = ttl;
    }

    async get(key: string): Promise<T | null> {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if the item has expired
        if (item.expiration <= Date.now()) {
            this.evictItem(key, item);
            return null;
        }

        // Update the access counter for LRU eviction
        this.accessCounter++;
        item.accessCounter = this.accessCounter;
        this.cache.set(key, item);

        return item.value;
    }

    async set(key: string, value: T, ttlOverride?: number): Promise<void> {
        // If maxItems is 0, caching is disabled
        if (this.maxItems === 0) return;

        const ttl = ttlOverride ?? this.defaultTTL;

        // Check if the key already exists in the cache
        const existingItem = this.cache.get(key);
        if (existingItem) {
            this.evictItem(key, existingItem);
        }

        // Evict expired items
        this.evictExpiredItems();

        // Evict LRU items if the cache size exceeds the max items
        this.evictLRUItems();

        // Add the new item to the cache
        this.accessCounter++;
        const newItem: CacheItem<T> = {
            value,
            accessCounter: this.accessCounter,
            expiration: Date.now() + ttl,
        };
        
        // Set timeout after item is created to avoid circular reference
        newItem.timeoutId = setTimeout(() => this.evictItem(key, newItem), ttl);
        this.cache.set(key, newItem);
    }

    async delete(key: string): Promise<void> {
        const item = this.cache.get(key);
        if (item) {
            this.evictItem(key, item);
        }
    }

    async deleteMissing(keysToKeep: string[]): Promise<void> {
        const keysToKeepSet = new Set(keysToKeep);
        for (const [key, item] of this.cache) {
            if (!keysToKeepSet.has(key)) {
                this.evictItem(key, item);
            }
        }
    }

    resetCache(): void {
        this.cache.forEach((item) => {
            if (item.timeoutId) {
                clearTimeout(item.timeoutId);
            }
        });
        this.cache.clear();
        this.accessCounter = 0;
    }

    /**
     * Clear all items from the cache (alias for resetCache)
     */
    clear(): void {
        this.resetCache();
    }

    private evictItem(key: string, item: CacheItem<T>): void {
        if (item.timeoutId) {
            clearTimeout(item.timeoutId);
        }
        this.cache.delete(key);
    }

    private evictExpiredItems(): void {
        this.cache.forEach((item, key) => {
            if (item.expiration <= Date.now()) {
                this.evictItem(key, item);
            }
        });
    }

    private evictLRUItems(): void {
        while (this.cache.size >= this.maxItems) {
            let oldestKey: string | undefined;
            let oldestAccessCounter = Number.MAX_SAFE_INTEGER;

            this.cache.forEach((item, k) => {
                if (item.accessCounter < oldestAccessCounter) {
                    oldestKey = k;
                    oldestAccessCounter = item.accessCounter;
                }
            });

            if (oldestKey) {
                this.evictItem(oldestKey, this.cache.get(oldestKey)!);
            }
        }
    }
}

export { type CacheProvider, LocalCache };
