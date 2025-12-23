// Cache interfaces and types
export { type CacheProvider, type CacheOptions } from "./types";

// Memory cache implementation
export { LocalCache } from "./local";

// Redis cache implementation (requires 'redis' package)
export { RedisCacheProvider, type RedisOptions } from "./redis";