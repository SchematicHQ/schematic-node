import * as api from "./api";
import { SchematicClient as BaseClient } from "./Client";

import { CacheProvider, LocalCache } from "./cache";
import { ConsoleLogger, Logger } from "./logger";
import { EventBuffer } from "./events";
import { offlineFetcher, provideFetcher } from "./core/fetcher/custom";

/**
 * Configuration options for the SchematicClient
 */
export interface SchematicOptions {
    /** API key for authentication */
    apiKey?: string;
    /** Custom base URL for API endpoints */
    basePath?: string;
    /** Cache provider configuration */
    cacheProviders?: {
        /** Providers for caching flag check results */
        flagChecks?: CacheProvider<boolean>[];
    };
    /** If using an API key that is not environment-specific, use this option to specify the environment */
    environmentId?: string;
    /** Interval in milliseconds for flushing event buffer */
    eventBufferInterval?: number;
    /** Default values for feature flags */
    flagDefaults?: { [key: string]: boolean };
    /** Additional HTTP headers for API requests */
    headers?: Record<string, string>;
    /** Custom logger implementation */
    logger?: Logger;
    /** Enable offline mode to prevent network activity */
    offline?: boolean;
}

export class SchematicClient extends BaseClient {
    private eventBuffer: EventBuffer;
    private flagCheckCacheProviders: CacheProvider<boolean>[];
    private flagDefaults: { [key: string]: boolean };
    private logger: Logger;
    private offline: boolean;

    /**
     * Creates a new instance of the SchematicClient
     * @param opts - Configuration options for the client
     */
    constructor(opts?: SchematicOptions) {
        const {
            apiKey = "",
            basePath,
            eventBufferInterval,
            flagDefaults = {},
            logger = new ConsoleLogger(),
        } = opts ?? {};
        let { offline = false } = opts ?? {};

        // Set headers
        const headers: Record<string, string> = {};
        if (opts?.environmentId) {
            headers["X-Schematic-Environment-Id"] = opts.environmentId;
        }
        if (opts?.headers) {
            Object.assign(headers, opts.headers);
        }

        // Handle implied offline mode
        if (offline) {
            if (apiKey !== "") {
                logger.debug("Offline mode enabled, ignoring API key");
            }
        } else if (apiKey === "" && !offline) {
            logger.warn("No API key was provided, running in offline mode");
            offline = true;
        }

        // Initialize wrapped client
        super({
            apiKey,
            environment: basePath,
            fetcher: offline ? offlineFetcher : provideFetcher(headers),
        });

        this.logger = logger;
        this.eventBuffer = new EventBuffer(this.events, {
            interval: eventBufferInterval,
            logger,
            offline,
        });
        this.flagCheckCacheProviders = opts?.cacheProviders?.flagChecks ?? [new LocalCache<boolean>()];
        this.flagDefaults = flagDefaults;
        this.offline = offline;
    }

    /**
     * Checks the value of a feature flag for the given evaluation context
     * @param evalCtx - The context (company and/or user) for evaluating the feature flag
     * @param key - The unique identifier of the feature flag
     * @returns Promise resolving to the flag's boolean value, falling back to default if unavailable
     * @throws Will log error and return flag default if check fails
     */
    async checkFlag(evalCtx: api.CheckFlagRequestBody, key: string): Promise<boolean> {
        if (this.offline) {
            this.logger.debug(`Offline mode enabled, returning default flag value for flag ${key}`);
            return this.getFlagDefault(key);
        }

        try {
            const cacheKey = JSON.stringify({ evalCtx, key });
            for (const provider of this.flagCheckCacheProviders) {
                const cachedValue = await provider.get(cacheKey);
                if (cachedValue !== undefined) {
                    this.logger.debug(`${provider.constructor.name} cache hit for flag ${key}`);
                    return cachedValue;
                }
            }

            const response = await this.features.checkFlag(key, evalCtx);
            if (response.data.value === undefined) {
                this.logger.debug(`No value returned from feature flag API for flag ${key}, falling back to default`);
                return this.getFlagDefault(key);
            }

            for (const provider of this.flagCheckCacheProviders) {
                await provider.set(cacheKey, response.data.value);
            }

            this.logger.debug(`Feature flag API response for ${key}: ${response.data}`);
            return response.data.value;
        } catch (err) {
            this.logger.error(`Error checking flag ${key}: ${err}`);
            return this.getFlagDefault(key);
        }
    }

    /**
     * Checks multiple feature flags with caching optimization
     * @param evalCtx - The context (company and/or user) for evaluating the feature flags
     * @param keys - Optional array of flag keys to check. If empty, calls standard checkFlags API
     * @returns Promise resolving to an array of flag check results
     * @throws Will log error and return default values if check fails
     */
    async checkFlags(evalCtx: api.CheckFlagRequestBody, keys?: string[]): Promise<api.CheckFlagResponseData[]> {
        if (this.offline) {
            this.logger.debug(`Offline mode enabled, returning default flag values for flags ${keys ? keys.join(', ') : 'all'}`);
            if (keys && keys.length > 0) {
                return keys.map(key => ({
                    flag: key,
                    value: this.getFlagDefault(key),
                    reason: 'Offline mode - using default value'
                }));
            } else {
                // In offline mode with no keys, return empty array
                return [];
            }
        }

        try {
            // If no keys provided or empty array, call standard checkFlags
            if (!keys || keys.length === 0) {
                this.logger.debug('No specific flag keys provided, calling standard checkFlags API');
                const response = await this.features.checkFlags(evalCtx);
                return response.data.flags;
            }

            // Check cache for all requested keys
            const cachedResults: Map<string, api.CheckFlagResponseData> = new Map();
            const missingKeys: string[] = [];

            for (const key of keys) {
                const cacheKey = JSON.stringify({ evalCtx, key });
                let foundInCache = false;

                for (const provider of this.flagCheckCacheProviders) {
                    const cachedValue = await provider.get(cacheKey);
                    if (cachedValue !== undefined) {
                        this.logger.debug(`${provider.constructor.name} cache hit for flag ${key}`);
                        cachedResults.set(key, {
                            flag: key,
                            value: cachedValue,
                            reason: 'Retrieved from cache'
                        });
                        foundInCache = true;
                        break;
                    }
                }

                if (!foundInCache) {
                    missingKeys.push(key);
                }
            }

            // If all keys were found in cache, return cached results
            if (missingKeys.length === 0) {
                this.logger.debug(`All ${keys.length} flags found in cache`);
                return keys.map(key => cachedResults.get(key)!);
            }

            // Call API for missing keys by calling standard checkFlags and filtering results
            this.logger.debug(`Cache miss for ${missingKeys.length} flags: ${missingKeys.join(', ')}, calling API`);
            const response = await this.features.checkFlags(evalCtx);
            const apiResults = response.data.flags;

            // Use fresh API values for ALL requested keys to ensure consistency
            // Cache and return the fresh values
            const results: api.CheckFlagResponseData[] = [];

            for (const key of keys) {
                // Find result from API response first (prioritize fresh data)
                const apiResult = apiResults.find(flag => flag.flag === key);
                if (apiResult) {
                    // Cache the fresh result
                    const cacheKey = JSON.stringify({ evalCtx, key });
                    for (const provider of this.flagCheckCacheProviders) {
                        await provider.set(cacheKey, apiResult.value);
                    }
                    results.push(apiResult);
                } else {
                    // Fall back to cached result if API doesn't return this flag
                    const cachedResult = cachedResults.get(key);
                    if (cachedResult) {
                        results.push(cachedResult);
                    } else {
                        // Flag not found anywhere, use default
                        this.logger.debug(`Flag ${key} not found in API response or cache, using default value`);
                        const defaultResult: api.CheckFlagResponseData = {
                            flag: key,
                            value: this.getFlagDefault(key),
                            reason: 'Flag not found - using default value'
                        };
                        results.push(defaultResult);
                    }
                }
            }

            this.logger.debug(`Checked ${keys.length} flags: used fresh API values for consistency (${missingKeys.length} were cache misses)`);
            return results;

        } catch (err) {
            this.logger.error(`Error checking flags ${keys ? keys.join(', ') : 'all'}: ${err}`);
            
            // Return default values for all requested keys
            if (keys && keys.length > 0) {
                return keys.map(key => ({
                    flag: key,
                    value: this.getFlagDefault(key),
                    reason: `Error occurred - using default value: ${err}`
                }));
            } else {
                return [];
            }
        }
    }

    /**
     * Gracefully shuts down the client by stopping the event buffer
     * @returns Promise that resolves when the event buffer has been stopped
     */
    async close(): Promise<void> {
        return this.eventBuffer.stop();
    }

    /**
     * Send a non-blocking event to create or update companies and users
     * @param body - The identify event payload containing user properties
     * @returns Promise that resolves when the event has been enqueued
     * @throws Will log error if event enqueueing fails
     */
    async identify(body: api.EventBodyIdentify): Promise<void> {
        if (this.offline) return;

        try {
            await this.enqueueEvent("identify", body);
        } catch (err) {
            this.logger.error(`Error sending identify event: ${err}`);
        }
    }

    /**
     * Send a non-blocking event to track usage
     * @param body - The track event payload containing event details
     * @returns Promise that resolves when the event has been enqueued
     * @throws Will log error if event enqueueing fails
     */
    async track(body: api.EventBodyTrack): Promise<void> {
        if (this.offline) return;

        try {
            await this.enqueueEvent("track", body);
        } catch (err) {
            this.logger.error(`Error sending track event: ${err}`);
        }
    }

    /**
     * Sets the default value for a specific feature flag
     * @param flag - The feature flag identifier
     * @param value - The default boolean value to set
     */
    setFlagDefault(flag: string, value: boolean): void {
        this.flagDefaults[flag] = value;
    }

    /**
     * Sets default values for multiple feature flags at once
     * @param values - Object mapping flag identifiers to their default boolean values
     */
    setFlagDefaults(values: { [key: string]: boolean }): void {
        Object.assign(this.flagDefaults, values);
    }

    private getFlagDefault(flag: string): boolean {
        return this.flagDefaults[flag] ?? false;
    }

    private async enqueueEvent(
        eventType: "identify" | "track",
        body: api.EventBodyIdentify | api.EventBodyTrack
    ): Promise<void> {
        try {
            this.eventBuffer.push({
                eventType,
                body,
                sentAt: new Date(),
            });
        } catch (err) {
            this.logger.error(`Error enqueueing ${eventType} event: ${err}`);
        }
    }
}

export class Schematic extends SchematicClient {}
