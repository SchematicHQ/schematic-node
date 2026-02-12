import { CacheProvider, CacheOptions } from "./types";

export interface RedisOptions extends CacheOptions {
  /** Redis connection URL (e.g., 'redis://localhost:6379') */
  url?: string;
  /** Redis host (default: 'localhost') */
  host?: string;
  /** Redis port (default: 6379) */
  port?: number;
  /** Redis password */
  password?: string;
  /** Redis database number (default: 0) */
  db?: number;
  /** Redis key prefix for all cache keys (default: 'schematic:') */
  keyPrefix?: string;
}

/**
 * Redis-based cache provider implementation
 * Requires the 'redis' package to be installed: npm install redis
 */
export class RedisCacheProvider<T> implements CacheProvider<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- redis client is dynamically imported
  private client: any;
  private defaultTTL: number;
  private keyPrefix: string;
  private isConnected: boolean = false;
  private initPromise: Promise<void>;

  constructor(options: RedisOptions = {}) {
    this.defaultTTL = Math.floor((options.ttl || 5000) / 1000); // Convert to seconds for Redis
    this.keyPrefix = options.keyPrefix || 'schematic:';
    
    // Dynamically import Redis to avoid requiring it if not used
    this.initPromise = this.initRedisClient(options);
  }

  private async initRedisClient(options: RedisOptions): Promise<void> {
    try {
      // Use require() to avoid TypeScript resolving the module at compile time.
      // This matches the pattern used for 'ws' in websocket-client.ts.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createClient } = require('redis');

      let clientConfig: Record<string, unknown> = {};
      
      if (options.url) {
        clientConfig.url = options.url;
      } else {
        clientConfig.socket = {
          host: options.host || 'localhost',
          port: options.port || 6379,
        };
        
        if (options.password) {
          clientConfig.password = options.password;
        }
        
        if (options.db !== undefined) {
          clientConfig.database = options.db;
        }
      }

      this.client = createClient(clientConfig);
      
      this.client.on('error', () => {
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
      });

      await this.client.connect();
      
    } catch (error) {
      throw new Error(
        'Redis package not found. Please install it with: npm install redis\n' +
        'Original error: ' + (error as Error).message
      );
    }
  }

  private getFullKey(key: string): string {
    return this.keyPrefix + key;
  }

  async get(key: string): Promise<T | null> {
    await this.initPromise;
    
    if (!this.isConnected || !this.client) {
      return null;
    }

    const fullKey = this.getFullKey(key);
    const value = await this.client.get(fullKey);
    
    if (value === null) {
      return null;
    }

    return JSON.parse(value) as T;
  }
    
  async set(key: string, value: T, ttl?: number): Promise<void> {
    await this.initPromise;
    
    if (!this.isConnected || !this.client) {
      return;
    }

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
    await this.initPromise;
    
    if (!this.isConnected || !this.client) {
      return;
    }

    const fullKey = this.getFullKey(key);
    await this.client.del(fullKey);
  }
    
  async deleteMissing(keysToKeep: string[], options?: { scanPattern?: string }): Promise<void> {
    await this.initPromise;
    
    if (!this.isConnected || !this.client) {
      return;
    }

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

  /**
   * Close the Redis connection
   */
  async close(): Promise<void> {
    await this.initPromise;
    
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  /**
   * Check if the Redis client is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}