import * as api from "./api";
import { SchematicClient as BaseClient } from "./Client";

import { CacheProvider, LocalCache } from "./cache";
import { ConsoleLogger, Logger } from "./logger";
import { EventBuffer } from "./events";
import { offlineFetcher, provideFetcher } from "./core/fetcher/custom";

export interface SchematicOptions {
    apiKey?: string;
    basePath?: string;
    cacheProviders?: {
        flagChecks?: CacheProvider<boolean>[];
    };
    environmentId?: string;
    eventBufferInterval?: number;
    flagDefaults?: { [key: string]: boolean };
    headers?: Record<string, string>;
    logger?: Logger;
    offline?: boolean;
}

export class SchematicClient extends BaseClient {
    private eventBuffer: EventBuffer;
    private flagCheckCacheProviders: CacheProvider<boolean>[];
    private flagDefaults: { [key: string]: boolean };
    private logger: Logger;
    private offline: boolean;

    constructor(opts?: SchematicOptions) {
        const { apiKey = "", offline = false } = opts ?? {};
        const headers: Record<string, string> = {};
        if (opts?.environmentId) {
            headers["X-Schematic-Environment-Id"] = opts.environmentId;
        }
        if (opts?.headers) {
            Object.assign(headers, opts.headers);
        }
        super({
            apiKey,
            environment: opts?.basePath ? opts.basePath : undefined,
            fetcher: offline ? offlineFetcher : provideFetcher(headers),
        });
        const { flagDefaults = {} } = opts ?? {};

        this.eventBuffer = new EventBuffer(this.events, {
            interval: opts?.eventBufferInterval,
            offline,
        });

        this.flagCheckCacheProviders = opts?.cacheProviders?.flagChecks ?? [new LocalCache<boolean>()];
        this.logger = opts?.logger || new ConsoleLogger();

        if (offline) {
            if (apiKey !== "") {
                this.logger.debug("Offline mode enabled, ignoring API key");
            }
        } else if (apiKey === "") {
            this.logger.warn("No API key was provided, running in offline mode");
            this.offline = true;
        }

        this.offline = offline;
        this.flagDefaults = flagDefaults;
    }

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

    async close(): Promise<void> {
        return this.eventBuffer.stop();
    }

    async identify(body: api.EventBodyIdentify): Promise<void> {
        if (this.offline) return;

        try {
            await this.enqueueEvent("identify", body);
        } catch (err) {
            this.logger.error(`Error sending identify event: ${err}`);
        }
    }

    async track(body: api.EventBodyTrack): Promise<void> {
        if (this.offline) return;

        try {
            await this.enqueueEvent("track", body);
        } catch (err) {
            this.logger.error(`Error sending track event: ${err}`);
        }
    }

    setFlagDefault(flag: string, value: boolean): void {
        this.flagDefaults[flag] = value;
    }

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
