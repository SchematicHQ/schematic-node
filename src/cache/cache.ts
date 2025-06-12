interface CacheProvider<T> {
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T, ttlOverride?: number): Promise<void>;
}

type CacheItem<T> = {
    value: T;
    accessCounter: number;
    expiration: number;
    timeoutId?: ReturnType<typeof setTimeout>;
};

export interface CacheOptions {
    maxItems?: number;
    ttl?: number;
}

export { CacheProvider, CacheItem };
