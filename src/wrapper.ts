import * as api from "./api";
import { SchematicClient as BaseClient } from "./Client";

import { type CacheProvider, LocalCache } from "./cache";
import { ConsoleLogger, type Logger, type LogLevel } from "./logger";
import { EventBuffer } from "./events";
import { EventCaptureClient } from "./event-capture";
import { offlineFetcher, provideFetcher } from "./core/fetcher/custom";
import { RUNTIME } from "./core/runtime";
import { DataStreamClient, type DataStreamClientOptions } from "./datastream";
import type { RedisClient } from "./cache/redis";
import {
    CreditLeaseManager,
    DEFAULT_PREWARM_POLL_INTERVAL_MS,
    DEFAULT_PREWARM_RESOLVE_TIMEOUT_MS,
    DEFAULT_SWEEP_INTERVAL_MS,
    LeaseStore,
    RedisLeaseStore,
    RedisReservationStore,
    ReservationStore,
    type ILeaseStore,
    type IReservationStore,
    type CheckOptions,
    type CheckResult,
    type CreditLeaseConfig,
    type Reservation,
    type TrackWithReservationOptions,
} from "./credits";
import { buildPreflightOptions, checkWithLease } from "./credits/check";
import { buildReservationTrackEvent, consumeReservationAndBuildEvent } from "./credits/track";

// Idempotency-key namespace for the Track event a reservation settles into.
// Deterministic per reservation, so a recovery emit (work outlived the local
// reservation TTL) and an accidental double `trackWithReservation` collapse to
// one event server-side: the events pipeline dedupes by (account, env,
// event_type, key) for 24h before any credit consumption runs.
const RESERVATION_TRACK_IDEMPOTENCY_PREFIX = "lease-reservation:";

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
        flagChecks?: CacheProvider<CheckFlagWithEntitlementResponse>[];
    };
    /** Enable DataStream for real-time updates */
    useDataStream?: boolean;
    /** DataStream configuration options */
    dataStream?: {
        /** Cache TTL in milliseconds (default: 5 minutes) */
        cacheTTL?: number;
        /** Pre-created, connected redis client for DataStream caching */
        redisClient?: RedisClient;
        /** Redis key prefix for all cache keys (default: 'schematic:') */
        redisKeyPrefix?: string;
        /** Enable replicator mode for external data synchronization */
        replicatorMode?: boolean;
        /** Health check URL for replicator mode */
        replicatorHealthURL?: string;
        /** Health check interval for replicator mode in milliseconds */
        replicatorHealthCheck?: number;
    };
    /** If using an API key that is not environment-specific, use this option to specify the environment */
    environmentId?: string;
    /** Custom base URL for the event capture service (default: https://c.schematichq.com) */
    eventCaptureBaseURL?: string;
    /** Interval in milliseconds for flushing event buffer */
    eventBufferInterval?: number;
    /** Default values for feature flags */
    flagDefaults?: { [key: string]: boolean };
    /** Additional HTTP headers for API requests */
    headers?: Record<string, string>;
    /** Custom logger implementation. When provided, its own level configuration is respected and `logLevel` is ignored. */
    logger?: Logger;
    /** Minimum level for the default logger (default: "warn"). Ignored when a custom `logger` is provided. */
    logLevel?: LogLevel;
    /** Enable offline mode to prevent network activity */
    offline?: boolean;
    /** The default maximum time to wait for a response in milliseconds */
    timeoutMs?: number;
    /**
     * Enable client-side credit lease + reservation behavior on `check` /
     * `trackWithReservation`. Omit to keep the SDK lease-unaware.
     *
     * Lease-bearing checks require DataStream (or replicator mode) so the
     * SDK has access to the cached flag + company state needed for local
     * gating against the lease balance.
     */
    creditLeases?: CreditLeaseConfig;
}

export interface CheckFlagOptions {
    /** Default value to return on error. Can be a boolean or a function returning a boolean. If not provided, uses configured flag defaults */
    defaultValue?: boolean | (() => boolean);
    /** The maximum time to wait for a response in milliseconds */
    timeoutMs?: number;
    /**
     * Preflight inputs forwarded to the WASM rules engine's
     * `checkFlagWithOptions`. The engine picks the most specific knob for each
     * condition it evaluates. Only applied when the flag is evaluated locally
     * (DataStream); the REST fallback path does not support preflight and
     * ignores these. No reservation is issued — for lease-backed gating use
     * `check()` instead.
     */
    /** Pre-computed per-credit-id cost. Highest precedence for credit-balance gates. */
    creditCost?: Record<string, number>;
    /** Single integer quantity applied to whatever numeric condition is being evaluated. */
    usage?: number;
    /**
     * Simulated quantity scoped to a specific event subtype. Preferred over
     * `usage` when the subtype is known. Deliberately singular: one check
     * preflights one action.
     */
    eventUsage?: { eventSubtype: string; quantity: number };
}

/**
 * Optional metadata for a track event. Only fields that are explicitly set are
 * sent to the capture service.
 */
export interface TrackOptions {
    /** Client-supplied dedupe key. Duplicate events with the same key (scoped to the environment) are dropped server-side for 24 hours. */
    idempotencyKey?: string;
    /** Timestamp the event was sent. Required when trustedClientClock is true. Defaults to the time the event is enqueued. */
    sentAt?: Date;
    /** When true, use sentAt as the effective event timestamp instead of server receipt time. Requires a secret API key and sentAt. */
    trustedClientClock?: boolean;
    /** Import historical data without affecting billing. Requires a secret API key and trustedClientClock. */
    backfill?: boolean;
}

/**
 * Optional metadata for an identify event. Only fields that are explicitly set
 * are sent to the capture service.
 */
export interface IdentifyOptions {
    /** Client-supplied dedupe key. Duplicate events with the same key (scoped to the environment) are dropped server-side for 24 hours. */
    idempotencyKey?: string;
    /**
     * Credit type IDs to acquire leases for in the background after the
     * identify event is enqueued. Fire-and-forget — failures are logged but
     * never surface to the caller. Equivalent to calling `client.prewarm()`
     * directly with the same evalCtx and creditTypeIds. No-op unless
     * `creditLeases` is configured on the client.
     */
    prewarm?: string[];
}

export interface CheckFlagWithEntitlementResponse {
    companyId?: string;
    entitlement?: api.RulesengineFeatureEntitlement;
    err?: string;
    flagKey: string;
    flagId?: string;
    reason: string;
    ruleId?: string;
    ruleType?: api.RulesengineRuleType;
    userId?: string;
    value: boolean;
}

export class SchematicClient extends BaseClient {
    private datastreamClient?: DataStreamClient;
    private eventBuffer: EventBuffer;
    private flagCheckCacheProviders: CacheProvider<CheckFlagWithEntitlementResponse>[];
    private flagDefaults: { [key: string]: boolean };
    private logger: Logger;
    private offline: boolean;
    private creditLeaseManager?: CreditLeaseManager;
    private leaseStore?: ILeaseStore;
    private reservations?: IReservationStore;
    // True when lease state lives in a shared (Redis) backend that sibling
    // pods may also be drawing on — close() must then NOT release leases.
    private leaseBackendShared: boolean = false;
    private prewarmResolveTimeoutMs: number = DEFAULT_PREWARM_RESOLVE_TIMEOUT_MS;

    /**
     * Creates a new instance of the SchematicClient
     * @param opts - Configuration options for the client
     */
    constructor(opts?: SchematicOptions) {
        const {
            apiKey = "",
            basePath,
            eventBufferInterval,
            eventCaptureBaseURL,
            flagDefaults = {},
            logLevel,
            timeoutMs,
        } = opts ?? {};
        let { offline = false } = opts ?? {};

        // A consumer-provided logger owns its own level configuration, so we use
        // it as-is and ignore logLevel. Otherwise build the default
        // ConsoleLogger at the requested level (defaulting to "warn").
        const logger: Logger = opts?.logger ?? new ConsoleLogger(logLevel);

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

        // Build the fetcher once and share it with the event capture client so
        // that offline mode, default headers, and retry/logging behavior stay
        // consistent across API calls and event capture submissions.
        const fetcher = offline ? offlineFetcher : provideFetcher(headers);

        // Initialize wrapped client
        super({
            apiKey,
            environment: basePath,
            fetcher,
            timeoutInSeconds: timeoutMs !== undefined ? timeoutMs / 1000 : undefined,
        });

        this.logger = logger;

        // Forward the same SDK identifying headers (X-Fern-Language,
        // X-Fern-SDK-Name, X-Fern-SDK-Version, etc.) that BaseClient added to
        // this._options.headers so that capture-service requests are
        // attributable to the same SDK build as REST requests.
        const sdkHeaders: Record<string, string> = {};
        const baseClientHeaders = this._options?.headers;
        if (baseClientHeaders) {
            for (const [key, value] of Object.entries(baseClientHeaders)) {
                if (typeof value === "string") {
                    sdkHeaders[key] = value;
                }
            }
        }

        const captureClient = new EventCaptureClient({
            apiKey,
            fetcher,
            headers: sdkHeaders,
            baseUrl: eventCaptureBaseURL,
            timeoutMs,
        });
        this.eventBuffer = new EventBuffer(captureClient, {
            interval: eventBufferInterval,
            logger,
            offline,
        });
        this.flagCheckCacheProviders = opts?.cacheProviders?.flagChecks ?? [
            new LocalCache<CheckFlagWithEntitlementResponse>(),
        ];
        this.flagDefaults = flagDefaults;
        this.offline = offline;

        // Initialize DataStream client if enabled
        if (opts?.useDataStream && !offline) {
            const edgeRuntimes = ["workerd", "edge-runtime", "browser", "web-worker"];
            const isEdgeRuntime = edgeRuntimes.includes(RUNTIME.type);
            const isReplicatorMode = opts.dataStream?.replicatorMode === true;

            if (isEdgeRuntime && !isReplicatorMode) {
                logger.warn(
                    `DataStream is not supported in ${RUNTIME.type} runtime and will be disabled. ` +
                        `DataStream requires Node.js APIs (WebSocket) that are not available in edge/browser environments. ` +
                        `Use replicatorMode for edge runtime compatibility.`,
                );
            } else {
                const datastreamOptions: DataStreamClientOptions = {
                    apiKey,
                    baseURL: basePath,
                    logger,
                    cacheTTL: opts.dataStream?.cacheTTL,
                    redisClient: opts.dataStream?.redisClient,
                    redisKeyPrefix: opts.dataStream?.redisKeyPrefix,
                    replicatorMode: opts.dataStream?.replicatorMode,
                    replicatorHealthURL: opts.dataStream?.replicatorHealthURL,
                    replicatorHealthCheck: opts.dataStream?.replicatorHealthCheck,
                };

                this.datastreamClient = new DataStreamClient(datastreamOptions);
                this.datastreamClient.start().catch((error) => {
                    logger.error(`Failed to start DataStream client: ${error}`);
                    this.datastreamClient = undefined;
                });
            }
        }

        // Set up credit lease + reservation plumbing if the caller opted in.
        if (opts?.creditLeases && offline) {
            logger.warn(
                "creditLeases is configured but the client is in offline mode — lease-gated checks are " +
                    "disabled and check() will return flag defaults with no credit gating.",
            );
        }
        if (opts?.creditLeases && !offline) {
            // Lease-bearing checks evaluate locally against the datastream's
            // cached flag + company state. Without it, every check() silently
            // falls back to a plain flag check — usage is ignored and no credit
            // gating happens — so surface the misconfiguration once, loudly,
            // instead of a per-check debug line.
            if (!this.datastreamClient) {
                logger.warn(
                    "creditLeases is configured but DataStream is not enabled — check() will fall back to " +
                        "plain flag checks with NO credit gating (usage is ignored). Set useDataStream: true " +
                        "(or replicatorMode) to enable lease-gated checks.",
                );
            }
            const sweepMs = opts.creditLeases.sweepIntervalMs ?? DEFAULT_SWEEP_INTERVAL_MS;
            // Lease + reservation state belongs in a shared cache so gating
            // holds across horizontally-scaled pods. Prefer an explicit
            // `creditLeases.redisClient`, but otherwise reuse the Redis client
            // the DataStream cache is already configured with — so an existing
            // Redis setup backs leases automatically, with no second client to
            // wire up. Same for the key prefix.
            const redisClient = opts.creditLeases.redisClient ?? opts.dataStream?.redisClient;
            const keyPrefix = opts.creditLeases.redisKeyPrefix ?? opts.dataStream?.redisKeyPrefix;
            if (redisClient) {
                // Shared-state backend: lease balance + reservation table live
                // in Redis. Lua-script-driven atomicity gives cross-pod gating
                // without a separate lock service.
                this.leaseBackendShared = true;
                this.leaseStore = new RedisLeaseStore({
                    client: redisClient,
                    keyPrefix,
                    defaultLeaseDurationMs: opts.creditLeases.defaultLeaseDuration,
                });
                this.reservations = new RedisReservationStore({
                    client: redisClient,
                    leaseStore: this.leaseStore,
                    sweepIntervalMs: sweepMs,
                    keyPrefix,
                });
            } else {
                // No shared backend configured: fall back to per-process
                // in-memory stores. In a horizontally-scaled deployment each pod
                // then acquires and gates against its own leases, which defeats
                // the cross-pod over-spend protection that is the point of
                // leasing — so warn rather than degrade silently.
                logger.warn(
                    "creditLeases is enabled without a shared Redis backend; lease and reservation " +
                        "state will be kept per-process. Configure dataStream.redisClient (or " +
                        "creditLeases.redisClient) so leases gate correctly across multiple SDK instances.",
                );
                this.leaseStore = new LeaseStore();
                this.reservations = new ReservationStore(this.leaseStore, sweepMs);
            }
            this.reservations.startSweep();
            this.creditLeaseManager = new CreditLeaseManager({
                creditsClient: this.credits,
                leaseStore: this.leaseStore,
                logger,
                config: opts.creditLeases,
            });
            this.prewarmResolveTimeoutMs =
                opts.creditLeases.prewarmResolveTimeoutMs ?? DEFAULT_PREWARM_RESOLVE_TIMEOUT_MS;
        }
    }

    /**
     * Returns whether DataStream is enabled and available
     */
    private useDataStream(): boolean {
        return this.datastreamClient !== undefined;
    }

    /**
     * Checks the value of a feature flag for the given evaluation context
     * @param evalCtx - The context (company and/or user) for evaluating the feature flag
     * @param key - The unique identifier of the feature flag
     * @param options - Optional configuration for the flag check
     * @returns Promise resolving to the flag's boolean value, falling back to default if unavailable
     * @throws Will log error and return flag default if check fails
     */
    async checkFlag(evalCtx: api.CheckFlagRequestBody, key: string, options?: CheckFlagOptions): Promise<boolean> {
        const resp = await this.checkFlagWithEntitlement(evalCtx, key, options);
        return resp.value;
    }

    /**
     * Checks the value of a feature flag and returns entitlement details for the given evaluation context
     * @param evalCtx - The context (company and/or user) for evaluating the feature flag
     * @param key - The unique identifier of the feature flag
     * @param options - Optional configuration for the flag check
     * @returns Promise resolving to the flag check response including entitlement details
     */
    async checkFlagWithEntitlement(
        evalCtx: api.CheckFlagRequestBody,
        key: string,
        options?: CheckFlagOptions,
    ): Promise<CheckFlagWithEntitlementResponse> {
        const getDefault = (): boolean => {
            if (options?.defaultValue === undefined) {
                return this.getFlagDefault(key);
            }
            return typeof options.defaultValue === "function" ? options.defaultValue() : options.defaultValue;
        };

        if (this.offline) {
            this.logger.debug(`Offline mode enabled, returning default flag value for flag ${key}`);
            return {
                flagKey: key,
                reason: "flag default",
                value: getDefault(),
            };
        }

        if (this.useDataStream()) {
            try {
                const resp = await this.datastreamClient!.checkFlag(evalCtx, key, options);

                // Enqueue the flag check event
                this.enqueueEvent(api.EventType.FlagCheck, {
                    flagKey: key,
                    value: resp?.value ?? false,
                    reason: resp?.reason ?? "unknown",
                    ruleId: resp?.ruleId,
                    companyId: resp?.companyId,
                    userId: resp?.userId,
                    flagId: resp?.flagId,
                    reqCompany: evalCtx.company,
                    reqUser: evalCtx.user,
                } satisfies api.EventBodyFlagCheck);

                return {
                    companyId: resp.companyId,
                    entitlement: resp.entitlement,
                    err: resp.err,
                    flagKey: resp.flagKey ?? key,
                    flagId: resp.flagId,
                    reason: resp.reason,
                    ruleId: resp.ruleId,
                    ruleType: resp.ruleType,
                    userId: resp.userId,
                    value: resp.value ?? this.getFlagDefault(key),
                };
            } catch (err) {
                this.logger.debug(`Datastream flag check failed (${err}), falling back to API`);
                return this.checkFlagViaAPI(evalCtx, key, options, getDefault);
            }
        }

        return this.checkFlagViaAPI(evalCtx, key, options, getDefault);
    }

    private async checkFlagViaAPI(
        evalCtx: api.CheckFlagRequestBody,
        key: string,
        options?: CheckFlagOptions,
        getDefault?: () => boolean,
    ): Promise<CheckFlagWithEntitlementResponse> {
        const getDefaultValue = getDefault ?? (() => this.getFlagDefault(key));

        try {
            const cacheKey = JSON.stringify({ evalCtx, key });
            for (const provider of this.flagCheckCacheProviders) {
                const cached = await provider.get(cacheKey);
                if (cached !== null && cached !== undefined) {
                    this.logger.debug(`${provider.constructor.name} cache hit for flag ${key}`);
                    return cached;
                }
            }

            const response = await this.features.checkFlag(key, evalCtx, {
                timeoutInSeconds: options?.timeoutMs !== undefined ? options.timeoutMs / 1000 : undefined,
            });
            if (response.data.value === undefined) {
                this.logger.debug(`No value returned from feature flag API for flag ${key}, falling back to default`);
                return {
                    flagKey: key,
                    reason: "flag default",
                    value: getDefaultValue(),
                };
            }

            this.logger.debug(`Feature flag API response for ${key}: ${JSON.stringify(response.data)}`);

            const result: CheckFlagWithEntitlementResponse = {
                companyId: response.data.companyId,
                entitlement: response.data.entitlement,
                err: response.data.error,
                flagKey: response.data.flag,
                flagId: response.data.flagId,
                reason: response.data.reason,
                ruleId: response.data.ruleId,
                ruleType: response.data.ruleType as api.RulesengineRuleType | undefined,
                userId: response.data.userId,
                value: response.data.value,
            };

            try {
                for (const provider of this.flagCheckCacheProviders) {
                    this.logger.debug(`Caching value for flag ${key} in ${provider.constructor.name}`);
                    await provider.set(cacheKey, result);
                }
            } catch (cacheErr) {
                this.logger.warn(`Cache write failed for flag ${key}: ${cacheErr}`);
            }

            return result;
        } catch (err) {
            this.logger.error(`Error checking flag ${key}: ${err}`);
            return {
                flagKey: key,
                reason: "flag default",
                value: getDefaultValue(),
            };
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
            this.logger.debug(
                `Offline mode enabled, returning default flag values for flags ${keys ? keys.join(", ") : "all"}`,
            );
            if (keys && keys.length > 0) {
                return keys.map((key) => ({
                    flag: key,
                    value: this.getFlagDefault(key),
                    reason: "Offline mode - using default value",
                }));
            } else {
                // In offline mode with no keys, return empty array
                return [];
            }
        }

        try {
            // DataStream path: evaluate all requested keys locally when available.
            // No flag_check events are enqueued for the bulk checkFlags codepath.
            if (this.useDataStream() && this.datastreamClient!.isConnected() && keys && keys.length > 0) {
                const dsResults = await this.checkFlagsViaDataStream(evalCtx, keys);
                if (dsResults) {
                    return dsResults;
                }
            }

            // If no keys provided or empty array, call standard checkFlags
            if (!keys || keys.length === 0) {
                this.logger.debug("No specific flag keys provided, calling standard checkFlags API");
                const response = await this.features.checkFlags(evalCtx);
                return response.data.flags;
            }

            // Check cache for all requested keys
            const cachedResults: Map<string, api.CheckFlagResponseData> = new Map();
            const missingKeys: string[] = [];

            // Read the cache for every key in parallel. The per-flag cache keys are
            // independent, so with a remote cache provider the reads issue concurrently
            // instead of serially. Order is preserved so missingKeys still mirrors keys.
            const lookups = await Promise.all(
                keys.map(async (key) => {
                    const cacheKey = JSON.stringify({ evalCtx, key });
                    for (const provider of this.flagCheckCacheProviders) {
                        const cached = await provider.get(cacheKey);
                        if (cached !== null && cached !== undefined) {
                            this.logger.debug(`${provider.constructor.name} cache hit for flag ${key}`);
                            return {
                                key,
                                cached: {
                                    flag: key,
                                    value: cached.value,
                                    reason: cached.reason,
                                } as api.CheckFlagResponseData,
                            };
                        }
                    }
                    return { key, cached: null };
                }),
            );

            for (const { key, cached } of lookups) {
                if (cached) {
                    cachedResults.set(key, cached);
                } else {
                    missingKeys.push(key);
                }
            }

            // If all keys were found in cache, return cached results
            if (missingKeys.length === 0) {
                this.logger.debug(`All ${keys.length} flags found in cache`);
                return keys.map((key) => cachedResults.get(key)!);
            }

            // Call API for missing keys by calling standard checkFlags and filtering results
            this.logger.debug(`Cache miss for ${missingKeys.length} flags: ${missingKeys.join(", ")}, calling API`);
            const response = await this.features.checkFlags(evalCtx);
            const apiResults = response.data.flags;

            // Use fresh API values for ALL requested keys to ensure consistency
            // Cache and return the fresh values
            const results: api.CheckFlagResponseData[] = [];

            // Index the API results by flag key so per-key lookups are O(1) instead of
            // re-scanning apiResults for every key (avoids O(N^2) matching).
            const apiResultsByFlag = new Map(apiResults.map((flag) => [flag.flag, flag]));

            // Collect cache writes so they can be issued concurrently after building the
            // results array, instead of awaiting each provider write one flag at a time.
            const cacheWrites: Array<{ cacheKey: string; cacheEntry: CheckFlagWithEntitlementResponse; key: string }> =
                [];

            for (const key of keys) {
                // Find result from API response first (prioritize fresh data)
                const apiResult = apiResultsByFlag.get(key);
                if (apiResult) {
                    // Queue the fresh result for caching
                    const cacheKey = JSON.stringify({ evalCtx, key });
                    const cacheEntry: CheckFlagWithEntitlementResponse = {
                        companyId: apiResult.companyId,
                        entitlement: apiResult.entitlement,
                        err: apiResult.error,
                        flagKey: apiResult.flag,
                        flagId: apiResult.flagId,
                        reason: apiResult.reason,
                        ruleId: apiResult.ruleId,
                        ruleType: apiResult.ruleType as api.RulesengineRuleType | undefined,
                        userId: apiResult.userId,
                        value: apiResult.value,
                    };
                    cacheWrites.push({ cacheKey, cacheEntry, key });
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
                            reason: "Flag not found - using default value",
                        };
                        results.push(defaultResult);
                    }
                }
            }

            // Issue the cache writes concurrently. Errors are isolated per flag so a
            // single failed write doesn't abort the rest (matching prior semantics).
            await Promise.all(
                cacheWrites.map(async ({ cacheKey, cacheEntry, key }) => {
                    try {
                        await Promise.all(
                            this.flagCheckCacheProviders.map((provider) => {
                                this.logger.debug(`Caching value for flag ${cacheKey} in ${provider.constructor.name}`);
                                return provider.set(cacheKey, cacheEntry);
                            }),
                        );
                    } catch (cacheErr) {
                        this.logger.warn(`Cache write failed for flag ${key}: ${cacheErr}`);
                    }
                }),
            );

            this.logger.debug(
                `Checked ${keys.length} flags: used fresh API values for consistency (${missingKeys.length} were cache misses)`,
            );
            return results;
        } catch (err) {
            this.logger.error(`Error checking flags ${keys ? keys.join(", ") : "all"}: ${err}`);

            // Return default values for all requested keys
            if (keys && keys.length > 0) {
                return keys.map((key) => ({
                    flag: key,
                    value: this.getFlagDefault(key),
                    reason: `Error occurred - using default value: ${err}`,
                }));
            } else {
                return [];
            }
        }
    }

    /**
     * Evaluate all requested keys via the DataStream client. Returns an array of
     * results on full success, or null if any key can't be evaluated (caller should
     * fall back to the API path). No flag_check events are enqueued here — bulk
     * checks intentionally do not emit per-flag events.
     */
    private async checkFlagsViaDataStream(
        evalCtx: api.CheckFlagRequestBody,
        keys: string[],
    ): Promise<api.CheckFlagResponseData[] | null> {
        const results: api.CheckFlagResponseData[] = [];

        for (const key of keys) {
            try {
                const resp = await this.datastreamClient!.checkFlag(evalCtx, key);
                results.push({
                    flag: resp.flagKey ?? key,
                    value: resp.value ?? this.getFlagDefault(key),
                    reason: resp.reason,
                    flagId: resp.flagId,
                    ruleId: resp.ruleId,
                    ruleType: resp.ruleType,
                    companyId: resp.companyId,
                    userId: resp.userId,
                    entitlement: resp.entitlement,
                    error: resp.err,
                });
            } catch (err) {
                this.logger.debug(`Datastream checkFlags falling back to API (${err})`);
                return null;
            }
        }

        this.logger.debug(`All ${keys.length} flags evaluated via DataStream`);
        return results;
    }

    /**
     * Gracefully shuts down the client by stopping the event buffer, the
     * reservation sweeper, and the DataStream client.
     *
     * Credit leases: with the per-process in-memory backend, this process is
     * the only holder of its leases, so they are released here (best-effort) —
     * their unspent remainder returns to the company balance immediately
     * instead of waiting out the lease expiry. With a shared (Redis) backend,
     * leases are deliberately *not* released: a lease is shared across every
     * SDK instance pointed at the same backend (one row per company+credit),
     * so a single pod shutting down must not release a lease that sibling pods
     * are still drawing on — doing so would refund the grant server-side and
     * pull the balance out from under them. Shared leases reclaim themselves:
     * they expire (client- and server-side) or are fully consumed.
     * @returns Promise that resolves when everything has been stopped
     */
    async close(): Promise<void> {
        if (this.reservations) {
            this.reservations.stop();
        }
        if (this.creditLeaseManager && !this.leaseBackendShared) {
            await this.creditLeaseManager.releaseAllLocalLeases();
        }
        if (this.datastreamClient) {
            this.datastreamClient.close();
        }
        return this.eventBuffer.stop();
    }

    /**
     * Pre-warm a credit lease for each given credit type ID, so the first
     * `check()` against it doesn't pay the acquire round-trip. Fire-and-forget
     * — failures are logged but don't throw.
     *
     * When `evalCtx.company` carries only secondary keys (no `id`), `prewarm`
     * actively fetches the company over the datastream (waiting up to
     * `creditLeases.prewarmResolveTimeoutMs` for the WS to connect), which both
     * resolves the id and warms the cache so the first `check()` hits the lease
     * path. Covers a brand-new company too: the fetch retries until the server
     * has ingested the preceding `identify` and can stream it back.
     */
    async prewarm(evalCtx: api.CheckFlagRequestBody, creditTypeIds: string[]): Promise<void> {
        if (!this.creditLeaseManager || !this.leaseStore) {
            this.logger.debug("prewarm called but creditLeases is not configured");
            return;
        }
        if (!evalCtx.company || Object.keys(evalCtx.company).length === 0) {
            this.logger.debug("prewarm requires a company on evalCtx");
            return;
        }
        const companyId = await this.resolveCompanyIdWithWait(evalCtx);
        if (!companyId) {
            this.logger.debug(
                `prewarm: company not resolved within ${this.prewarmResolveTimeoutMs}ms for keys ${JSON.stringify(evalCtx.company)} (first check() will acquire)`,
            );
            return;
        }
        await Promise.all(
            creditTypeIds.map((id) =>
                this.creditLeaseManager!.acquireIfNeeded(companyId, id).catch((err) =>
                    this.logger.warn(`prewarm: failed to acquire lease for ${id}: ${err}`),
                ),
            ),
        );
    }

    /**
     * Like `resolveCompanyId` but actively fetches the company over the
     * datastream when only secondary keys are supplied, warming the cache as a
     * side effect. Returns the resolved id, or undefined if the company never
     * surfaced within `prewarmResolveTimeoutMs`.
     *
     * `identify` does not push a company into the datastream cache —  companies
     * are only streamed in response to a request. So we call `getCompany`
     * (cache-first, then sends the request and awaits the push) rather than
     * passively polling `getCachedCompany`, which would watch an empty cache
     * until it times out. Fetching also primes the cache so the first real
     * `check()` hits the lease path instead of falling back.
     */
    private async resolveCompanyIdWithWait(evalCtx: api.CheckFlagRequestBody): Promise<string | undefined> {
        if (!evalCtx.company) return undefined;
        if (evalCtx.company.id) return evalCtx.company.id;
        const datastream = this.datastreamClient;
        if (!datastream || this.prewarmResolveTimeoutMs <= 0) {
            return this.resolveCompanyId(evalCtx);
        }
        const company = evalCtx.company;
        // Fast path — already cached by an earlier check or prewarm.
        const cached = await datastream.getCachedCompany(company);
        if (cached?.id) return cached.id;
        // Actively fetch. Retry across the brief WS-connecting window at boot
        // (getCompany throws "not connected" until the socket is ready),
        // bounded by prewarmResolveTimeoutMs.
        const deadline = Date.now() + this.prewarmResolveTimeoutMs;
        for (;;) {
            try {
                const resolved = await datastream.getCompany(company);
                if (resolved?.id) return resolved.id;
            } catch (err) {
                this.logger.debug(`prewarm: datastream company fetch failed (${err})`);
            }
            if (Date.now() >= deadline) return undefined;
            await new Promise((r) => setTimeout(r, DEFAULT_PREWARM_POLL_INTERVAL_MS));
        }
    }

    /**
     * Lease-aware feature check. When `creditLeases` is configured and the
     * caller passes `usage` (optionally qualified by `eventSubtype`), this
     * acquires a lease (if needed), gates the check against the lease's local
     * balance via WASM, and returns a reservation handle on success — pass
     * that handle to `trackWithReservation` when the work completes.
     *
     * When `creditLeases` is not configured (or `usage` is omitted) this falls
     * through to a plain flag check and returns `{allowed: value}` with no
     * reservation, byte-compatible with `checkFlag` semantics. The caller's
     * preflight (`usage` / `eventSubtype`) is still threaded through the plain
     * check, so any client-side evaluation path (datastream, replicator)
     * gates on the post-call balance — just without a reservation. Only the
     * REST fallback ignores preflight.
     */
    async check(evalCtx: api.CheckFlagRequestBody, key: string, options?: CheckOptions): Promise<CheckResult> {
        const fallback = async (): Promise<CheckResult> => {
            const resp = await this.checkFlagWithEntitlement(evalCtx, key, {
                defaultValue: options?.defaultValue,
                timeoutMs: options?.timeoutMs,
                ...(options ? buildPreflightOptions(options) : undefined),
            });
            return {
                allowed: resp.value,
                value: resp.value,
                reason: resp.reason,
                entitlement: resp.entitlement,
                flagKey: resp.flagKey,
                flagId: resp.flagId,
                err: resp.err,
            };
        };

        const hasPreflight = options?.usage !== undefined;
        if (!hasPreflight || !this.creditLeaseManager || !this.leaseStore || !this.reservations) {
            return fallback();
        }

        return checkWithLease(
            {
                leaseStore: this.leaseStore,
                reservations: this.reservations,
                manager: this.creditLeaseManager,
                datastream: this.datastreamClient,
                logger: this.logger,
                // Lease-path checks must stay visible to flag-check analytics
                // and company last-seen, same as every plain checkFlag path.
                enqueueFlagCheckEvent: (body) => this.enqueueEvent(api.EventType.FlagCheck, body),
            },
            key,
            evalCtx,
            options,
            fallback,
        );
    }

    /**
     * Consume a reservation issued by `check()`. Refunds the unused slice
     * (`creditsReserved - actualQuantity * consumptionRate`) back to the
     * lease's local balance and enqueues a Track event with
     * `quantity = actualQuantity`. The server-side event processor consumes
     * `actualQuantity × consumption_rate` from the company's real credit
     * balance.
     *
     * If the work outlived the reservation's TTL and the sweeper already
     * returned the hold to the lease, the local refund has happened but the
     * usage must still be billed — so we emit the Track anyway (a "recovery"
     * emit). The server bills it against the lease's sub-ledger if the lease is
     * still live, or falls through to a direct grant decrement if the server
     * lease has itself expired.
     *
     * Double-billing is prevented server-side: the Track carries a deterministic
     * `idempotencyKey` derived from the reservation id, and the events pipeline
     * drops duplicates by `(account, env, event_type, key)` for 24h before any
     * credit consumption runs. So a recovery emit racing the normal emit, or an
     * accidental second `trackWithReservation`, collapses to a single billed
     * event — across pods and process restarts, not just within one process.
     */
    async trackWithReservation(
        reservation: Reservation,
        actualQuantity: number,
        options?: TrackWithReservationOptions,
    ): Promise<void> {
        if (this.offline) return;
        // Mirror the check-path usage guard: a non-finite quantity must reach
        // neither the store (`Math.min(NaN, reserved)` claims the reservation
        // with NO refund of the unspent slice) nor the billing event (NaN
        // serializes to `quantity: null`); a negative one would bill negative
        // usage. Skip the settle entirely — the untouched reservation expires
        // at its TTL and the sweeper refunds the full hold, so no credits are
        // lost and nothing bogus is billed.
        if (!Number.isFinite(actualQuantity) || actualQuantity < 0) {
            this.logger.error(
                `trackWithReservation: invalid actualQuantity ${actualQuantity} for reservation ${reservation.id} ` +
                    `— must be a finite, non-negative number; skipping settle (the hold is refunded at its TTL)`,
            );
            return;
        }
        if (!this.reservations) {
            this.logger.warn(
                "trackWithReservation called but creditLeases is not configured — emitting unsettled track",
            );
            // No local store to settle against, but the billing event must
            // still carry the `leaseId` (the handle was issued by a
            // lease-configured client — dropping it would double-debit the
            // grant) and the deterministic idempotency key (so a duplicate
            // emit still dedupes server-side).
            await this.track(buildReservationTrackEvent(reservation, actualQuantity, options), {
                idempotencyKey: `${RESERVATION_TRACK_IDEMPOTENCY_PREFIX}${reservation.id}`,
            });
            return;
        }
        let track: api.EventBodyTrack;
        let settledLocally: boolean;
        try {
            ({ track, settledLocally } = await consumeReservationAndBuildEvent(
                this.reservations,
                reservation,
                actualQuantity,
                options,
            ));
        } catch (err) {
            // The local settle (store consume/refund) failed — likely an
            // unreachable Redis. The usage still has to be billed: build the
            // Track from the caller-held handle and emit it anyway. The
            // un-settled local hold is reclaimed by the sweeper at its TTL or
            // at lease expiry; the idempotency key below keeps a retried
            // settle from double-billing.
            this.logger.warn(
                `trackWithReservation: failed to settle reservation ${reservation.id} locally (${err}) — emitting track anyway`,
            );
            track = buildReservationTrackEvent(reservation, actualQuantity, options);
            settledLocally = false;
        }
        if (!settledLocally) {
            this.logger.debug(
                `trackWithReservation: reservation ${reservation.id} was not settled locally (expired/swept, already settled, or store unreachable) — emitting track keyed for idempotent server-side dedupe`,
            );
        }
        // Deterministic idempotency key so duplicate/recovery emits dedupe
        // server-side rather than double-billing the lease's sub-ledger.
        await this.track(track, {
            idempotencyKey: `${RESERVATION_TRACK_IDEMPOTENCY_PREFIX}${reservation.id}`,
        });
    }

    private async resolveCompanyId(evalCtx: api.CheckFlagRequestBody): Promise<string | undefined> {
        if (!evalCtx.company) return undefined;
        // If the caller passed `id`, use that directly.
        if (evalCtx.company.id) return evalCtx.company.id;
        // Otherwise, the datastream cache can resolve secondary keys → id.
        if (this.datastreamClient) {
            const cached = await this.datastreamClient.getCachedCompany(evalCtx.company);
            return cached?.id;
        }
        return undefined;
    }

    /**
     * Send a non-blocking event to create or update companies and users.
     * Pass `options.prewarm` with credit type IDs to kick off lease acquires in
     * the background after the identify event is enqueued (no-op unless
     * `creditLeases` is configured on the client).
     */
    async identify(body: api.EventBodyIdentify, options?: IdentifyOptions): Promise<void> {
        if (this.offline) return;

        try {
            await this.enqueueEvent("identify", body, options);
        } catch (err) {
            this.logger.error(`Error sending identify event: ${err}`);
        }

        if (options?.prewarm && options.prewarm.length > 0) {
            const evalCtx: api.CheckFlagRequestBody = {
                company: body.company?.keys,
                user: body.keys,
            };
            // Force-flush so the server processes the identify ASAP — without
            // it, the company may sit in the local buffer for up to the
            // buffer's flush interval before the server even sees it, and
            // prewarm's bounded poll would just be waiting on us. Fire-and-forget.
            void this.eventBuffer.flush().catch((err) => {
                this.logger.debug(`identify flush before prewarm failed: ${err}`);
            });
            void this.prewarm(evalCtx, options.prewarm).catch((err) => {
                this.logger.warn(`identify prewarm failed: ${err}`);
            });
        }
    }

    /**
     * Send a non-blocking event to track usage
     * @param body - The track event payload containing event details
     * @param options - Optional event metadata (e.g. idempotencyKey, trustedClientClock)
     * @returns Promise that resolves when the event has been enqueued
     * @throws Will log error if event enqueueing fails
     */
    async track(body: api.EventBodyTrack, options?: TrackOptions): Promise<void> {
        if (this.offline) return;

        try {
            await this.enqueueEvent("track", body, options);

            // Update company metrics in DataStream if available and connected
            if (body.company && this.useDataStream() && this.datastreamClient!.isConnected()) {
                try {
                    await this.datastreamClient!.updateCompanyMetrics(body.company, body.event, body.quantity || 1);
                } catch (err) {
                    this.logger.error(`Failed to update company metrics: ${err}`);
                }
            }
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
        eventType: api.EventType,
        body: api.EventBody,
        options?: TrackOptions | IdentifyOptions,
    ): Promise<void> {
        try {
            const event: api.CreateEventRequestBody = {
                eventType,
                body,
                sentAt: new Date(),
            };

            if (options) {
                if (options.idempotencyKey !== undefined) {
                    event.idempotencyKey = options.idempotencyKey;
                }
                if ("sentAt" in options && options.sentAt !== undefined) {
                    event.sentAt = options.sentAt;
                }
                if ("trustedClientClock" in options && options.trustedClientClock !== undefined) {
                    event.trustedClientClock = options.trustedClientClock;
                }
                if ("backfill" in options && options.backfill !== undefined) {
                    event.backfill = options.backfill;
                }
            }

            this.eventBuffer.push(event);
        } catch (err) {
            this.logger.error(`Error enqueueing ${eventType} event: ${err}`);
        }
    }
}

export class Schematic extends SchematicClient {}
