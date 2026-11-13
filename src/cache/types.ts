/**
 * Cache provider interface for storing and retrieving entities
 */
export interface CacheProvider<T> {
  /** Get a value from cache */
  get(key: string): Promise<T | null>;
  /** Set a value in cache */
  set(key: string, value: T, ttl?: number): Promise<void>;
  /**
   * Set a value in cache and keep the key's current expiry. A key with no
   * expiry keeps none. Optional: providers without it fall back to `set`.
   */
  setKeepTTL?(key: string, value: T): Promise<void>;
  /** Delete a value from cache */
  delete(key: string): Promise<void>;
  /** Delete all keys not in the keysToKeep array (optional, for bulk operations) */
  deleteMissing?(keysToKeep: string[], options?: { scanPattern?: string }): Promise<void>;
}

export interface CacheOptions {
  maxItems?: number;
  ttl?: number;
}