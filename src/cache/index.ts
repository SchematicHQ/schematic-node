// Cache interfaces and types
export { CacheProvider, CacheOptions } from "./types";

// Memory cache implementation
export { LocalCache } from "./local";

// Redis cache implementation (requires 'redis' package)
export { RedisCacheProvider, RedisOptions } from "./redis";