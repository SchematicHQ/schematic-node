import { EventEmitter } from 'events';
import * as Schematic from '../api/types';
import { DatastreamWSClient } from './websocket-client';
import { DataStreamResp, DataStreamReq, EntityType, MessageType } from './types';
import { RulesEngineClient } from '../rules-engine';
import { Logger } from '../logger';

// Import cache providers from the cache module  
import type { CacheProvider } from '../cache/types';
import { LocalCache } from '../cache/local';
import { RedisCacheProvider, type RedisOptions } from '../cache/redis';

/**
 * Options for configuring the DataStream client
 */
export interface DataStreamClientOptions {
  /** Schematic API key for authentication */
  apiKey: string;
  /** Base URL for the API (will be converted to WebSocket URL) */
  baseURL?: string;
  /** Logger for debug/info/error messages */
  logger: Logger;
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL?: number;
  /** Redis configuration for all cache providers (if not provided, uses memory cache) */
  redisConfig?: RedisOptions;
  /** Custom cache provider for company entities (overrides Redis config if provided) */
  companyCache?: CacheProvider<Schematic.RulesengineCompany>;
  /** Custom cache provider for user entities (overrides Redis config if provided) */
  userCache?: CacheProvider<Schematic.RulesengineUser>;
  /** Custom cache provider for flag entities (overrides Redis config if provided) */
  flagCache?: CacheProvider<Schematic.RulesengineFlag>;
  /** Enable replicator mode for external data synchronization */
  replicatorMode?: boolean;
  /** Health check URL for replicator mode */
  replicatorHealthURL?: string;
  /** Health check interval for replicator mode in milliseconds */
  replicatorHealthCheck?: number;
}

/**
 * Pending request handler type for companies and users
 */
type PendingRequestHandler<T> = (value: T | null) => void;

// Cache key constants
const CACHE_KEY_PREFIX = 'schematic';
const CACHE_KEY_PREFIX_COMPANY = 'company';
const CACHE_KEY_PREFIX_USER = 'user';  
const CACHE_KEY_PREFIX_FLAGS = 'flags';
const RESOURCE_TIMEOUT = 30 * 1000; // 30 seconds
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours (matches Go defaultTTL)
const MAX_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days (matches Go maxCacheTTL)

/**
 * DataStreamClient provides a comprehensive client for Schematic's datastream
 * with caching, flag evaluation, and entity management matching the Go implementation
 */
export class DataStreamClient extends EventEmitter {
  private readonly apiKey: string;
  private readonly baseURL?: string;
  private readonly logger: Logger;
  private readonly cacheTTL: number;

  // Cache providers
  private readonly companyCacheProvider: CacheProvider<Schematic.RulesengineCompany>;
  private readonly userCacheProvider: CacheProvider<Schematic.RulesengineUser>;
  private readonly flagsCacheProvider: CacheProvider<Schematic.RulesengineFlag>;

  // WebSocket client
  private wsClient?: DatastreamWSClient;

  // Rules engine for flag evaluation
  private rulesEngine: RulesEngineClient;

  // Replicator mode configuration
  private readonly replicatorMode: boolean;
  private readonly replicatorHealthURL?: string;
  private readonly replicatorHealthCheck: number;
  private replicatorReady = false;
  private replicatorHealthInterval?: NodeJS.Timeout;
  private replicatorCacheVersion?: string;

  // Pending requests - maps cache key to array of handlers
  private pendingCompanyRequests = new Map<string, PendingRequestHandler<Schematic.RulesengineCompany>[]>();
  private pendingUserRequests = new Map<string, PendingRequestHandler<Schematic.RulesengineUser>[]>();
  private pendingFlagRequest?: PendingRequestHandler<boolean>;

  constructor(options: DataStreamClientOptions) {
    super();

    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL;
    this.logger = options.logger;
    this.cacheTTL = options.cacheTTL ?? DEFAULT_TTL;

    // Initialize cache providers based on configuration
    this.companyCacheProvider = this.createCacheProvider(options, 'company');
    this.userCacheProvider = this.createCacheProvider(options, 'user');
    this.flagsCacheProvider = this.createCacheProvider(options, 'flag');

    // Replicator mode settings
    this.replicatorMode = options.replicatorMode ?? false;
    this.replicatorHealthURL = options.replicatorHealthURL;
    this.replicatorHealthCheck = options.replicatorHealthCheck ?? 30 * 1000; // Default 30 seconds

    // Initialize rules engine
    this.rulesEngine = new RulesEngineClient();
  }

  /**
   * Creates cache providers based on configuration options
   * Priority: custom cache provider > Redis config > memory cache
   * Flag cache uses special TTL logic matching Go implementation
   */
  private createCacheProvider<T>(options: DataStreamClientOptions, cacheType: 'company' | 'user' | 'flag'): CacheProvider<T> {
    // Check for custom cache provider first
    let customProvider: CacheProvider<T> | undefined;
    switch (cacheType) {
      case 'company':
        customProvider = options.companyCache as CacheProvider<T>;
        break;
      case 'user':
        customProvider = options.userCache as CacheProvider<T>;
        break;
      case 'flag':
        customProvider = options.flagCache as CacheProvider<T>;
        break;
    }

    if (customProvider) {
      return customProvider;
    }

    // Calculate TTL based on cache type
    const cacheTTL = this.calculateCacheTTL(cacheType);

    // Use Redis if configuration is provided
    if (options.redisConfig) {
      const redisOptions: RedisOptions = {
        ...options.redisConfig,
        ttl: cacheTTL,
        keyPrefix: options.redisConfig.keyPrefix || 'schematic:'
      };
      return new RedisCacheProvider<T>(redisOptions);
    }

    // Default to memory cache
    return new LocalCache<T>();
  }

  /**
   * Calculates cache TTL based on cache type, matching Go implementation
   * - Flag cache: use the greater of maxCacheTTL (30 days) or configured cacheTTL
   * - Other caches: use configured cacheTTL (defaults to 24 hours)
   */
  private calculateCacheTTL(cacheType: 'company' | 'user' | 'flag'): number {
    if (cacheType === 'flag') {
      // Flag TTL logic matches Go: use greater of maxCacheTTL or configured TTL
      return Math.max(MAX_CACHE_TTL, this.cacheTTL);
    }
    return this.cacheTTL;
  }

  /**
   * Start initializes and starts the datastream client
   */
  public async start(): Promise<void> {
    // Initialize rules engine first
    try {
      await this.rulesEngine.initialize();
      this.logger.debug('Rules engine initialized successfully');
    } catch (error) {
      this.logger.warn(`Failed to initialize rules engine: ${error}`);
    }

    // In replicator mode, we don't establish WebSocket connections
    if (this.replicatorMode) {
      this.logger.info('Replicator mode enabled - skipping WebSocket connection');
      if (this.replicatorHealthURL) {
        this.startReplicatorHealthCheck();
      }
      return;
    }

    if (!this.baseURL) {
      throw new Error('BaseURL is required when not in replicator mode');
    }

    this.logger.info('Starting DataStream client');

    // Create WebSocket client
    this.wsClient = new DatastreamWSClient({
      url: this.baseURL,
      apiKey: this.apiKey,
      logger: this.logger,
      messageHandler: this.handleMessage.bind(this),
      connectionReadyHandler: this.handleConnectionReady.bind(this),
    });

    // Set up event handlers
    this.wsClient.on('connected', () => {
      this.emit('connected');
    });

    this.wsClient.on('disconnected', () => {
      this.emit('disconnected');
      this.clearPendingRequests();
    });

    this.wsClient.on('ready', () => {
      this.emit('ready');
    });

    this.wsClient.on('not-ready', () => {
      this.emit('not-ready');
    });

    this.wsClient.on('error', (error) => {
      this.emit('error', error);
    });

    // Start WebSocket client
    this.wsClient.start();
  }

  /**
   * IsConnected returns whether the client is connected to the datastream
   * In replicator mode, returns true if the external replicator is ready
   */
  public isConnected(): boolean {
    if (this.replicatorMode) {
      return this.isReplicatorReady();
    }

    return this.wsClient?.isConnected() ?? false;
  }

  /**
   * GetCompany retrieves a company by keys, using cache or datastream
   */
  public async getCompany(keys: Record<string, string>): Promise<Schematic.RulesengineCompany> {
    // Check cache first for any of the keys
    const cached = await this.getCompanyFromCache(keys);
    if (cached) {
      this.logger.debug(`Company found in cache for keys: ${JSON.stringify(keys)}`);
      return cached;
    }

    // Handle replicator mode behavior - in replicator mode, only use cached data
    if (this.replicatorMode) {
      throw new Error('Company not found in cache and replicator mode is enabled');
    }

    // If not in cache and not connected, throw error
    if (!this.isConnected()) {
      throw new Error('DataStream client is not connected');
    }

    // Check if there's already a pending request for any of these keys
    const cacheKeys = this.generateCacheKeysForCompany(keys);
    let existingRequest = false;

    for (const cacheKey of cacheKeys) {
      if (this.pendingCompanyRequests.has(cacheKey)) {
        existingRequest = true;
        break;
      }
    }

    return new Promise<Schematic.RulesengineCompany>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanupPendingCompanyRequests(cacheKeys, handler);
        reject(new Error('Timeout while waiting for company data'));
      }, RESOURCE_TIMEOUT);

      const handler: PendingRequestHandler<Schematic.RulesengineCompany> = (company) => {
        clearTimeout(timeout);
        if (company) {
          resolve(company);
        } else {
          reject(new Error('Company not found'));
        }
      };

      // Add handler to all cache keys
      for (const cacheKey of cacheKeys) {
        if (!this.pendingCompanyRequests.has(cacheKey)) {
          this.pendingCompanyRequests.set(cacheKey, []);
        }
        this.pendingCompanyRequests.get(cacheKey)!.push(handler);
      }

      // Only send request if there wasn't already one pending
      if (!existingRequest) {
        this.sendDataStreamRequest({
          entity_type: EntityType.COMPANY,
          keys,
        }).catch((error) => {
          this.cleanupPendingCompanyRequests(cacheKeys, handler);
          reject(error);
        });
      }
    });
  }

  /**
   * GetUser retrieves a user by keys, using cache or datastream
   */
  public async getUser(keys: Record<string, string>): Promise<Schematic.RulesengineUser> {
    // Check cache first for any of the keys
    const cached = await this.getUserFromCache(keys);
    if (cached) {
      this.logger.debug(`User found in cache for keys: ${JSON.stringify(keys)}`);
      return cached;
    }

    // Handle replicator mode behavior - in replicator mode, only use cached data
    if (this.replicatorMode) {
      throw new Error('User not found in cache and replicator mode is enabled');
    }

    // If not in cache and not connected, throw error
    if (!this.isConnected()) {
      throw new Error('DataStream client is not connected');
    }

    // Check if there's already a pending request for any of these keys
    const cacheKeys = this.generateCacheKeysForUser(keys);
    let existingRequest = false;

    for (const cacheKey of cacheKeys) {
      if (this.pendingUserRequests.has(cacheKey)) {
        existingRequest = true;
        break;
      }
    }

    return new Promise<Schematic.RulesengineUser>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanupPendingUserRequests(cacheKeys, handler);
        reject(new Error('Timeout while waiting for user data'));
      }, RESOURCE_TIMEOUT);

      const handler: PendingRequestHandler<Schematic.RulesengineUser> = (user) => {
        clearTimeout(timeout);
        if (user) {
          resolve(user);
        } else {
          reject(new Error('User not found'));
        }
      };

      // Add handler to all cache keys
      for (const cacheKey of cacheKeys) {
        if (!this.pendingUserRequests.has(cacheKey)) {
          this.pendingUserRequests.set(cacheKey, []);
        }
        this.pendingUserRequests.get(cacheKey)!.push(handler);
      }

      // Only send request if there wasn't already one pending
      if (!existingRequest) {
        this.sendDataStreamRequest({
          entity_type: EntityType.USER,
          keys,
        }).catch((error) => {
          this.cleanupPendingUserRequests(cacheKeys, handler);
          reject(error);
        });
      }
    });
  }

  /**
   * GetFlag retrieves a flag by key from cache
   */
  public async getFlag(flagKey: string): Promise<Schematic.RulesengineFlag | null> {
    const cacheKey = this.flagCacheKey(flagKey);
    this.logger.debug(`Retrieving flag from cache: ${flagKey} (cache key: ${cacheKey})`);
    try {
      const result = await this.flagsCacheProvider.get(cacheKey);
      return result || null;
    } catch (error) {
      this.logger.warn(`Failed to retrieve flag from cache: ${error}`);
      return null;
    }
  }

  /**
   * GetAllFlags requests a refresh of all flags from the datastream
   */
  public async getAllFlags(): Promise<void> {
    // Check if there is already a pending request for flags
    if (this.pendingFlagRequest) {
      return new Promise<void>((resolve, reject) => {
        // Wait for existing request to complete
        const originalHandler = this.pendingFlagRequest!;
        this.pendingFlagRequest = (success: boolean | null) => {
          originalHandler(success);
          if (success) {
            resolve();
          } else {
            reject(new Error('Failed to refresh flags'));
          }
        };
      });
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingFlagRequest = undefined;
        reject(new Error('Timeout while waiting for flags data'));
      }, RESOURCE_TIMEOUT);

      this.pendingFlagRequest = (success: boolean | null) => {
        clearTimeout(timeout);
        this.pendingFlagRequest = undefined;
        if (success) {
          resolve();
        } else {
          reject(new Error('Failed to refresh flags'));
        }
      };

      this.sendDataStreamRequest({
        entity_type: EntityType.FLAGS,
      }).catch((error) => {
        clearTimeout(timeout);
        this.pendingFlagRequest = undefined;
        reject(error);
      });
    });
  }

  /**
   * CheckFlag evaluates a flag for a company and/or user context
   */
  public async checkFlag(
    evalCtx: { company?: Record<string, string>; user?: Record<string, string> },
    flagKey: string
  ): Promise<Schematic.RulesengineCheckFlagResult> {
    // Get flag first - return error if not found
    const flag = await this.getFlag(flagKey);
    if (!flag) {
      throw new Error(`Flag not found: ${flagKey}`);
    }

    const needsCompany = evalCtx.company && Object.keys(evalCtx.company).length > 0;
    const needsUser = evalCtx.user && Object.keys(evalCtx.user).length > 0;

    let cachedCompany: Schematic.RulesengineCompany | null = null;
    let cachedUser: Schematic.RulesengineUser | null = null;

    // Try to get cached data first
    if (needsCompany) {
      cachedCompany = await this.getCompanyFromCache(evalCtx.company!);
      this.logger.debug(`Company ${cachedCompany ? 'found in cache' : 'not found in cache'} for keys: ${JSON.stringify(evalCtx.company)}`);
    }
    if (needsUser) {
      cachedUser = await this.getUserFromCache(evalCtx.user!);
      this.logger.debug(`User ${cachedUser ? 'found in cache' : 'not found in cache'} for keys: ${JSON.stringify(evalCtx.user)}`);
    }

    // Handle replicator mode behavior
    if (this.replicatorMode) {
      // In replicator mode, if we don't have all cached data, evaluate with null values instead of fetching
      // The external replicator should have populated the cache with all necessary data
      return this.evaluateFlag(flag, cachedCompany, cachedUser);
    }

    // Non-replicator mode: if we have all cached data we need, use it
    if ((!needsCompany || cachedCompany) && (!needsUser || cachedUser)) {
      this.logger.debug(`All required resources found in cache for flag ${flagKey} evaluation`);
      return this.evaluateFlag(flag, cachedCompany, cachedUser);
    }

    // Check if we're connected to datastream for live fetching
    if (!this.isConnected()) {
      throw new Error('Datastream not connected and required entities not in cache');
    }

    // Fetch missing data from datastream
    let company: Schematic.RulesengineCompany | null = null;
    let user: Schematic.RulesengineUser | null = null;

    if (needsCompany) {
      if (cachedCompany) {
        company = cachedCompany;
        this.logger.debug(`Using cached company data for keys: ${JSON.stringify(evalCtx.company)}`);
      } else {
        this.logger.debug(`Fetching company from datastream for keys: ${JSON.stringify(evalCtx.company)}`);
        company = await this.getCompany(evalCtx.company!);
      }
    }

    if (needsUser) {
      if (cachedUser) {
        user = cachedUser;
        this.logger.debug(`Using cached user data for keys: ${JSON.stringify(evalCtx.user)}`);
      } else {
        this.logger.debug(`Fetching user from datastream for keys: ${JSON.stringify(evalCtx.user)}`);
        user = await this.getUser(evalCtx.user!);
      }
    }

    // Evaluate against the rules engine
    return this.evaluateFlag(flag, company, user);
  }

  /**
   * UpdateCompanyMetrics updates company metrics locally (for track events)
   */
  public async updateCompanyMetrics(keys: Record<string, string>, event: string, quantity: number): Promise<void> {
    const company = await this.getCompanyFromCache(keys);
    if (!company) {
      return; // No company in cache to update
    }

    // Create a deep copy to avoid modifying the cached object
    const updatedCompany = this.deepCopyCompany(company);

    // Update the metric value if it matches the event
    if (updatedCompany.metrics) {
      for (const metric of updatedCompany.metrics) {
        if (metric?.eventSubtype === event) {
          metric.value = (metric.value || 0) + quantity;
        }
      }
    }

    // Update cache with the modified company
    await this.cacheCompanyForKeys(updatedCompany);
  }

  /**
   * Close gracefully closes the datastream client
   */
  public close(): void {
    this.logger.info('Closing DataStream client');

    // Stop replicator health checks
    if (this.replicatorHealthInterval) {
      clearInterval(this.replicatorHealthInterval);
      this.replicatorHealthInterval = undefined;
    }

    // Clear all pending requests
    this.clearPendingRequests();

    // Close WebSocket client
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = undefined;
    }

    this.logger.info('DataStream client closed');
  }

  /**
   * IsReplicatorReady returns whether the external replicator is ready
   */
  public isReplicatorReady(): boolean {
    return this.replicatorReady;
  }

  /**
   * IsReplicatorMode returns whether the client is running in replicator mode
   */
  public isReplicatorMode(): boolean {
    return this.replicatorMode;
  }

  /**
   * GetReplicatorCacheVersion returns the current cache version from the replicator
   */
  public getReplicatorCacheVersion(): string | undefined {
    return this.replicatorCacheVersion;
  }

  /**
   * GetReplicatorCacheVersionAsync attempts to fetch cache version immediately if not available
   */
  public async getReplicatorCacheVersionAsync(timeoutMs = 2000): Promise<string | undefined> {
    // If we already have a cache version, return it immediately
    if (this.replicatorCacheVersion) {
      return this.replicatorCacheVersion;
    }

    // If we don't have a cache version yet and we're in replicator mode, try to get it
    if (this.replicatorMode && this.replicatorHealthURL) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(this.replicatorHealthURL, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const healthData = await response.json() as { ready?: boolean; cache_version?: string; cacheVersion?: string };
          const newCacheVersion = healthData.cache_version || healthData.cacheVersion;
          if (newCacheVersion) {
            this.replicatorCacheVersion = newCacheVersion;
            return newCacheVersion;
          }
        }
      } catch (error) {
        this.logger.debug(`Failed to fetch replicator cache version: ${error}`);
      }
    }

    return undefined;
  }

  /**
   * handleMessage processes incoming datastream messages
   */
  private async handleMessage(message: DataStreamResp): Promise<void> {
    this.logger.debug(`Processing datastream message: EntityType=${message.entity_type}, MessageType=${message.message_type}`);

    try {
      if (message.message_type === MessageType.ERROR) {
        await this.handleErrorMessage(message);
        return;
      }

      switch (message.entity_type) {
        case EntityType.COMPANY:
        case EntityType.COMPANIES:
          await this.handleCompanyMessage(message);
          break;
        case EntityType.USER:
        case EntityType.USERS:
          await this.handleUserMessage(message);
          break;
        case EntityType.FLAGS:
          await this.handleFlagsMessage(message);
          break;
        case EntityType.FLAG:
          await this.handleFlagMessage(message);
          break;
        default:
          this.logger.warn(`Unknown entity type in datastream message: ${message.entity_type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing datastream message: ${error}`);
      this.emit('error', error);
    }
  }

  /**
   * handleCompanyMessage processes company-specific datastream messages
   */
  private async handleCompanyMessage(message: DataStreamResp): Promise<void> {
    const company = message.data as Schematic.RulesengineCompany;
    
    if (!company) {
      return;
    }

    if (message.message_type === MessageType.DELETE) {
      // Remove company from cache
      if (company.keys) {
        for (const [key, value] of Object.entries(company.keys)) {
          const cacheKey = this.resourceKeyToCacheKey(CACHE_KEY_PREFIX_COMPANY, key, value);
          try {
            await this.companyCacheProvider.delete(cacheKey);
          } catch (error) {
            this.logger.warn(`Failed to delete company from cache: ${error}`);
          }
        }
      }
      return;
    }

    // Cache the company
    await this.cacheCompanyForKeys(company);

    // Notify pending requests
    this.notifyPendingCompanyRequests(company.keys || {}, company);
  }

  /**
   * handleUserMessage processes user-specific datastream messages
   */
  private async handleUserMessage(message: DataStreamResp): Promise<void> {
    const user = message.data as Schematic.RulesengineUser;
    
    if (!user) {
      return;
    }

    if (message.message_type === MessageType.DELETE) {
      // Remove user from cache
      if (user.keys) {
        for (const [key, value] of Object.entries(user.keys)) {
          const cacheKey = this.resourceKeyToCacheKey(CACHE_KEY_PREFIX_USER, key, value);
          try {
            await this.userCacheProvider.delete(cacheKey);
          } catch (error) {
            this.logger.warn(`Failed to delete user from cache: ${error}`);
          }
        }
      }
      return;
    }

    // Cache the user
    if (user.keys) {
      for (const [key, value] of Object.entries(user.keys)) {
        const cacheKey = this.resourceKeyToCacheKey(CACHE_KEY_PREFIX_USER, key, value);
        try {
          await this.userCacheProvider.set(cacheKey, user, this.cacheTTL);
        } catch (error) {
          this.logger.warn(`Failed to cache user: ${error}`);
        }
      }
    }

    // Notify pending requests
    this.notifyPendingUserRequests(user.keys || {}, user);
  }

  /**
   * handleFlagsMessage processes bulk flags messages
   */
  private async handleFlagsMessage(message: DataStreamResp): Promise<void> {
    const flags = message.data as Schematic.RulesengineFlag[];
    
    if (!Array.isArray(flags)) {
      this.logger.warn('Expected flags array in bulk flags message');
      return;
    }

    const results = await Promise.allSettled(
      flags
        .filter((flag) => flag?.key)
        .map(async (flag) => {
          const cacheKey = this.flagCacheKey(flag.key!);
          await this.flagsCacheProvider.set(cacheKey, flag);
          return cacheKey;
        }),
    );

    const cacheKeys = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      this.logger.warn(`Failed to cache ${failures.length} flag(s)`);
    }

    // Delete flags not in the response
    if (this.flagsCacheProvider.deleteMissing) {
      try {
        // Only scan flag keys (flags:*) for better performance
        await this.flagsCacheProvider.deleteMissing(cacheKeys, { scanPattern: 'flags:*' });
      } catch (error) {
        this.logger.warn(`Failed to delete missing flags: ${error}`);
      }
    }

    // Notify pending flag request
    if (this.pendingFlagRequest) {
      this.pendingFlagRequest(true);
    }
  }

  /**
   * handleFlagMessage processes single flag messages
   */
  private async handleFlagMessage(message: DataStreamResp): Promise<void> {
    const flag = message.data as Schematic.RulesengineFlag;
    
    if (!flag?.key) {
      return;
    }

    const cacheKey = this.flagCacheKey(flag.key);

    try {
      switch (message.message_type) {
        case MessageType.DELETE:
          await this.flagsCacheProvider.delete(cacheKey);
          break;
        case MessageType.FULL:
          await this.flagsCacheProvider.set(cacheKey, flag);
          break;
        default:
          this.logger.warn(`Unhandled message type for flag: ${message.message_type}`);
          break;
      }
    } catch (error) {
      this.logger.warn(`Failed to update flag cache: ${error}`);
    }

    // Notify pending flag request
    if (this.pendingFlagRequest) {
      this.pendingFlagRequest(true);
    }
  }

  /**
   * handleErrorMessage processes error messages
   */
  private async handleErrorMessage(message: DataStreamResp): Promise<void> {
    const errorData = message.data as any;
    
    if (errorData?.keys && errorData?.entity_type) {
      // Notify pending requests with null/error
      switch (errorData.entity_type) {
        case EntityType.COMPANY:
          this.notifyPendingCompanyRequests(errorData.keys, null);
          break;
        case EntityType.USER:
          this.notifyPendingUserRequests(errorData.keys, null);
          break;
        default:
          this.logger.warn(`Received error for unsupported entity type: ${errorData.entity_type}`);
      }
    }

    // Log the error but don't emit error event - just continue processing like Go implementation
    const errorMessage = errorData?.error || 'Unknown datastream error';
    this.logger.warn(`DataStream error received: ${errorMessage}`);
  }

  /**
   * handleConnectionReady is called when the WebSocket connection is ready
   */
  private async handleConnectionReady(): Promise<void> {
    this.logger.info('DataStream connection is ready');
    
    // Request initial flag data
    try {
      await this.getAllFlags();
      this.logger.debug('Requested initial flag data');
    } catch (error) {
      this.logger.error(`Failed to request initial flag data: ${error}`);
      throw error;
    }
  }

  /**
   * sendDataStreamRequest sends a request to the datastream
   */
  private async sendDataStreamRequest(request: DataStreamReq): Promise<void> {
    if (!this.wsClient || !this.wsClient.isConnected()) {
      throw new Error('DataStream client is not connected');
    }

    this.logger.debug(`Sending datastream request: EntityType=${request.entity_type}, Keys=${JSON.stringify(request.keys)}`);
    
    // Package the message like the Go implementation
    const packagedMessage = {
      data: request
    };
    
    await this.wsClient.sendMessage(packagedMessage);
  }

  /**
   * getCompanyFromCache attempts to retrieve a company from cache using any of the provided keys
   */
  private async getCompanyFromCache(keys: Record<string, string>): Promise<Schematic.RulesengineCompany | null> {
    for (const [key, value] of Object.entries(keys)) {
      const cacheKey = this.resourceKeyToCacheKey(CACHE_KEY_PREFIX_COMPANY, key, value);
      try {
        const company = await this.companyCacheProvider.get(cacheKey);
        if (company) {
          return company;
        }
      } catch (error) {
        this.logger.warn(`Failed to retrieve company from cache: ${error}`);
      }
    }
    return null;
  }

  /**
   * getUserFromCache attempts to retrieve a user from cache using any of the provided keys
   */
  private async getUserFromCache(keys: Record<string, string>): Promise<Schematic.RulesengineUser | null> {
    for (const [key, value] of Object.entries(keys)) {
      const cacheKey = this.resourceKeyToCacheKey(CACHE_KEY_PREFIX_USER, key, value);
      try {
        const user = await this.userCacheProvider.get(cacheKey);
        if (user) {
          return user;
        }
      } catch (error) {
        this.logger.warn(`Failed to retrieve user from cache: ${error}`);
      }
    }
    return null;
  }

  /**
   * cacheCompanyForKeys caches a company for all of its keys
   */
  private async cacheCompanyForKeys(company: Schematic.RulesengineCompany): Promise<void> {
    if (!company.keys || Object.keys(company.keys).length === 0) {
      throw new Error('No keys provided for company lookup');
    }

    for (const [key, value] of Object.entries(company.keys)) {
      const cacheKey = this.resourceKeyToCacheKey(CACHE_KEY_PREFIX_COMPANY, key, value);
      try {
        await this.companyCacheProvider.set(cacheKey, company, this.cacheTTL);
      } catch (error) {
        this.logger.warn(`Failed to cache company for key '${cacheKey}': ${error}`);
      }
    }
  }

  /**
   * generateCacheKeysForCompany generates all cache keys for a company's keys
   */
  private generateCacheKeysForCompany(keys: Record<string, string>): string[] {
    return Object.entries(keys).map(([key, value]) => 
      this.resourceKeyToCacheKey(CACHE_KEY_PREFIX_COMPANY, key, value)
    );
  }

  /**
   * generateCacheKeysForUser generates all cache keys for a user's keys
   */
  private generateCacheKeysForUser(keys: Record<string, string>): string[] {
    return Object.entries(keys).map(([key, value]) => 
      this.resourceKeyToCacheKey(CACHE_KEY_PREFIX_USER, key, value)
    );
  }

  /**
   * notifyPendingCompanyRequests notifies all pending company requests
   */
  private notifyPendingCompanyRequests(keys: Record<string, string>, company: Schematic.RulesengineCompany | null): void {
    for (const [key, value] of Object.entries(keys)) {
      const cacheKey = this.resourceKeyToCacheKey(CACHE_KEY_PREFIX_COMPANY, key, value);
      const handlers = this.pendingCompanyRequests.get(cacheKey);
      if (handlers) {
        this.pendingCompanyRequests.delete(cacheKey);
        handlers.forEach(handler => {
          try {
            handler(company);
          } catch (error) {
            this.logger.error(`Error in company request handler: ${error}`);
          }
        });
      }
    }
  }

  /**
   * notifyPendingUserRequests notifies all pending user requests
   */
  private notifyPendingUserRequests(keys: Record<string, string>, user: Schematic.RulesengineUser | null): void {
    for (const [key, value] of Object.entries(keys)) {
      const cacheKey = this.resourceKeyToCacheKey(CACHE_KEY_PREFIX_USER, key, value);
      const handlers = this.pendingUserRequests.get(cacheKey);
      if (handlers) {
        this.pendingUserRequests.delete(cacheKey);
        handlers.forEach(handler => {
          try {
            handler(user);
          } catch (error) {
            this.logger.error(`Error in user request handler: ${error}`);
          }
        });
      }
    }
  }

  /**
   * cleanupPendingCompanyRequests removes a specific handler from pending company requests
   */
  private cleanupPendingCompanyRequests(cacheKeys: string[], handler: PendingRequestHandler<Schematic.RulesengineCompany>): void {
    for (const cacheKey of cacheKeys) {
      const handlers = this.pendingCompanyRequests.get(cacheKey);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
        if (handlers.length === 0) {
          this.pendingCompanyRequests.delete(cacheKey);
        }
      }
    }
  }

  /**
   * cleanupPendingUserRequests removes a specific handler from pending user requests
   */
  private cleanupPendingUserRequests(cacheKeys: string[], handler: PendingRequestHandler<Schematic.RulesengineUser>): void {
    for (const cacheKey of cacheKeys) {
      const handlers = this.pendingUserRequests.get(cacheKey);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
        if (handlers.length === 0) {
          this.pendingUserRequests.delete(cacheKey);
        }
      }
    }
  }

  /**
   * clearPendingRequests clears all pending requests
   */
  private clearPendingRequests(): void {
    // Clear company requests
    for (const [, handlers] of this.pendingCompanyRequests) {
      handlers.forEach(handler => {
        try {
          handler(null);
        } catch (error) {
          this.logger.error(`Error clearing company request: ${error}`);
        }
      });
    }
    this.pendingCompanyRequests.clear();

    // Clear user requests
    for (const [, handlers] of this.pendingUserRequests) {
      handlers.forEach(handler => {
        try {
          handler(null);
        } catch (error) {
          this.logger.error(`Error clearing user request: ${error}`);
        }
      });
    }
    this.pendingUserRequests.clear();

    // Clear flag request
    if (this.pendingFlagRequest) {
      try {
        this.pendingFlagRequest(false);
      } catch (error) {
        this.logger.error(`Error clearing flag request: ${error}`);
      }
      this.pendingFlagRequest = undefined;
    }
  }

  /**
   * startReplicatorHealthCheck starts periodic health checks for replicator mode
   */
  private startReplicatorHealthCheck(): void {
    if (!this.replicatorHealthURL) {
      return;
    }

    this.logger.info(`Starting replicator health check with URL: ${this.replicatorHealthURL}, interval: ${this.replicatorHealthCheck}ms`);

    // Initial health check
    this.checkReplicatorHealth();

    // Set up periodic health checks
    this.replicatorHealthInterval = setInterval(() => {
      this.checkReplicatorHealth();
    }, this.replicatorHealthCheck);
  }

  /**
   * checkReplicatorHealth performs a single health check against the external replicator
   */
  private async checkReplicatorHealth(): Promise<void> {
    if (!this.replicatorHealthURL) {
      return;
    }

    try {
      const response = await fetch(this.replicatorHealthURL, {
        method: 'GET',
        // @ts-ignore - timeout is supported in newer Node.js versions
        timeout: 5000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const healthData = await response.json() as { ready?: boolean; cache_version?: string; cacheVersion?: string };
      const wasReady = this.replicatorReady;
      this.replicatorReady = healthData.ready ?? false;

      // Extract cache version from response if available
      const newCacheVersion = healthData.cache_version || healthData.cacheVersion;
      if (newCacheVersion && newCacheVersion !== this.replicatorCacheVersion) {
        const oldVersion = this.replicatorCacheVersion;
        this.replicatorCacheVersion = newCacheVersion;
        this.logger.info(`Cache version changed from ${oldVersion || '(null)'} to ${newCacheVersion}`);
      }

      // Log state changes
      if (this.replicatorReady && !wasReady) {
        this.logger.info('External replicator is now ready');
        this.emit('replicator-health-changed', true);
      } else if (!this.replicatorReady && wasReady) {
        this.logger.info('External replicator is no longer ready');
        this.emit('replicator-health-changed', false);
      }
    } catch (error) {
      if (this.replicatorReady) {
        this.replicatorReady = false;
        this.logger.info('External replicator is no longer ready');
        this.emit('replicator-health-changed', false);
      }
      this.logger.debug(`Replicator health check failed: ${error}`);
    }
  }

  /**
   * flagCacheKey generates a cache key for a flag
   */
  private flagCacheKey(key: string): string {
    // Use replicator cache version if available, otherwise use rules engine version
    const versionKey = this.replicatorMode && this.replicatorCacheVersion 
      ? this.replicatorCacheVersion 
      : this.getRulesEngineVersionKey();
    
    const cacheKey = `${CACHE_KEY_PREFIX_FLAGS}:${versionKey}:${key.toLowerCase()}`;
    
    this.logger.debug(`Generated flag cache key - flag: ${key}, mode: ${this.replicatorMode ? 'replicator' : 'datastream'}, version: ${versionKey}, cacheKey: ${cacheKey}`);
    
    return cacheKey;
  }

  /**
   * resourceKeyToCacheKey generates a cache key for a resource
   */
  private resourceKeyToCacheKey(resourceType: string, key: string, value: string): string {
    // Use replicator cache version if available, otherwise use rules engine version
    const versionKey = this.replicatorMode && this.replicatorCacheVersion 
      ? this.replicatorCacheVersion 
      : this.getRulesEngineVersionKey();
    return `${resourceType}:${versionKey}:${key.toLowerCase()}:${value.toLowerCase()}`;
  }

  /**
   * deepCopyCompany creates a complete deep copy of a Company struct
   */
  private deepCopyCompany(company: Schematic.RulesengineCompany): Schematic.RulesengineCompany {
    // Use JSON parsing for a deep copy - this matches the Go implementation approach
    return JSON.parse(JSON.stringify(company));
  }

  /**
   * evaluateFlag evaluates a flag using the rules engine
   */
  private sanitizeForWasm(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeForWasm(item)).filter(item => item !== null);
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedValue = this.sanitizeForWasm(value);
        if (sanitizedValue !== null) {
          sanitized[key] = sanitizedValue;
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  private async evaluateFlag(
    flag: Schematic.RulesengineFlag,
    company: Schematic.RulesengineCompany | null,
    user: Schematic.RulesengineUser | null
  ): Promise<Schematic.RulesengineCheckFlagResult> {
    try {
      // Use rules engine if initialized
      if (this.rulesEngine.isInitialized()) {
        this.logger.debug(`Evaluating flag with rules engine: ${JSON.stringify({ flagId: flag.id, flagRules: flag.rules?.length || 0, companyId: company?.id, userId: user?.id })}`);
        
        // Sanitize flag data for WASM - ensure no null values in required arrays
        const sanitizedFlag = this.sanitizeForWasm(flag);
        if (!sanitizedFlag.rules) {
          sanitizedFlag.rules = [];
        }
        
        // Sanitize company and user data as well
        const sanitizedCompany = company ? this.sanitizeForWasm(company) : null;
        const sanitizedUser = user ? this.sanitizeForWasm(user) : null;
        
        const result = await this.rulesEngine.checkFlag(sanitizedFlag, sanitizedCompany, sanitizedUser);
        this.logger.debug(`Rules engine evaluation result: ${JSON.stringify(result)}`);
        return {
          flagKey: flag.key,
          value: result.value ?? flag.defaultValue,
          reason: result.reason || 'RULES_ENGINE_EVALUATION',
          companyId: company?.id,
          userId: user?.id,
          flagId: flag.id,
          ruleId: result.ruleId
        };
      } else {
        // Fallback to default value if rules engine not available
        this.logger.warn('Rules engine not initialized, using default flag value');
        return {
          flagKey: flag.key,
          value: flag.defaultValue,
          reason: 'RULES_ENGINE_UNAVAILABLE',
          companyId: company?.id,
          userId: user?.id,
          flagId: flag.id
        };
      }
    } catch (error) {
      this.logger.error(`Rules engine evaluation failed: ${error}`);
      // Fallback to default value on error
      return {
        flagKey: flag.key,
        value: flag.defaultValue,
        reason: 'RULES_ENGINE_ERROR',
        companyId: company?.id,
        userId: user?.id,
        flagId: flag.id
      };
    }
  }

  /**
   * getRulesEngineVersionKey gets the version key from the rules engine
   */
  private getRulesEngineVersionKey(): string {
    try {
      if (this.rulesEngine.isInitialized()) {
        return this.rulesEngine.getVersionKey();
      }
    } catch (error) {
      this.logger.warn(`Failed to get rules engine version key: ${error}`);
    }
    // Fallback to '1' if rules engine is not available or fails
    return '1';
  }
}