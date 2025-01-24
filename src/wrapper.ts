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
            return this.getFlagDefault(key);
        }

        try {
            const cacheKey = JSON.stringify({ evalCtx, key });
            for (const provider of this.flagCheckCacheProviders) {
                const cachedValue = await provider.get(cacheKey);
                if (cachedValue !== undefined) {
                    return cachedValue;
                }
            }

            const response = await this.features.checkFlag(key, evalCtx);
            if (!response.data.value) {
                return this.getFlagDefault(key);
            }

            for (const provider of this.flagCheckCacheProviders) {
                await provider.set(cacheKey, response.data.value);
            }

            return response.data.value;
        } catch (err) {
            this.logger.error(`Error checking flag ${key}: ${err}`);
            return this.getFlagDefault(key);
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
