// Cache interfaces and types
export { type CacheProvider, type CacheOptions } from "./types";

// Memory cache implementation
export { LocalCache } from "./local";

// Redis cache implementation (consumer provides their own redis client)
export { RedisCacheProvider, type RedisClient } from "./redis";