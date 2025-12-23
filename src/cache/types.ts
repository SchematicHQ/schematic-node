/**
 * Cache provider interface for storing and retrieving entities
 */
export interface CacheProvider<T> {
  /** Get a value from cache */
  get(key: string): Promise<T | null>;
  /** Set a value in cache */
  set(key: string, value: T, ttl?: number): Promise<void>;
  /** Delete a value from cache */
  delete(key: string): Promise<void>;
  /** Delete all keys not in the keysToKeep array (optional, for bulk operations) */
  deleteMissing?(keysToKeep: string[]): Promise<void>;
  /** Reset/clear the entire cache */
  resetCache?(): void;
}

export interface CacheOptions {
  maxItems?: number;
  ttl?: number;
}