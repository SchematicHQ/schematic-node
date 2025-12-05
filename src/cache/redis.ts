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
  private client: any; // Redis client type
  private defaultTTL: number;
  private keyPrefix: string;
  private isConnected: boolean = false;

  constructor(options: RedisOptions = {}) {
    this.defaultTTL = Math.floor((options.ttl || 5000) / 1000); // Convert to seconds for Redis
    this.keyPrefix = options.keyPrefix || 'schematic:';
    
    // Dynamically import Redis to avoid requiring it if not used
    this.initRedisClient(options);
  }

  private async initRedisClient(options: RedisOptions): Promise<void> {
    try {
      // Try to dynamically import redis using eval to avoid TypeScript compilation errors
      const redisModule = await eval(`import('redis')`);
      const { createClient } = redisModule;
      
      let clientConfig: any = {};
      
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
      
      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
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
    if (!this.isConnected || !this.client) {
      console.log(`Debug: Redis not connected (connected: ${this.isConnected}, client: ${!!this.client}) for key: ${key}`);
      return null;
    }

    try {
      const fullKey = this.getFullKey(key);
      console.log(`Debug: Redis GET attempt - key: ${key}, fullKey: ${fullKey}, port: ${this.client.options?.socket?.port || 'unknown'}`);
      const value = await this.client.get(fullKey);
      
      if (value === null) {
        console.log(`Debug: Redis GET result - key not found: ${fullKey}`);
        return null;
      }

      console.log(`Debug: Redis GET result - key found: ${fullKey}`);
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const fullKey = this.getFullKey(key);
      const serializedValue = JSON.stringify(value);
      const actualTTL = ttl ? Math.floor(ttl / 1000) : this.defaultTTL;

      if (actualTTL > 0) {
        await this.client.setEx(fullKey, actualTTL, serializedValue);
      } else {
        await this.client.set(fullKey, serializedValue);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const fullKey = this.getFullKey(key);
      await this.client.del(fullKey);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async deleteMissing(keysToKeep: string[]): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      // Get all keys with our prefix
      const pattern = this.keyPrefix + '*';
      const allKeys = await this.client.keys(pattern);
      
      if (allKeys.length === 0) {
        return;
      }

      // Convert keysToKeep to full keys
      const fullKeysToKeep = new Set(keysToKeep.map(k => this.getFullKey(k)));
      
      // Find keys to delete
      const keysToDelete = allKeys.filter((key: string) => !fullKeysToKeep.has(key));
      
      if (keysToDelete.length > 0) {
        await this.client.del(keysToDelete);
      }
    } catch (error) {
      console.error('Redis deleteMissing error:', error);
    }
  }

  /**
   * Reset all keys with our prefix (implements resetCache)
   */
  resetCache(): void {
    this.clear().catch(console.error);
  }

  /**
   * Clear all keys with our prefix
   */
  async clear(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      const pattern = this.keyPrefix + '*';
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  /**
   * Close the Redis connection
   */
  async close(): Promise<void> {
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