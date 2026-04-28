import { CreateEventRequestBody, EventBody, EventType } from "./api";
import * as serializers from "./serialization";
import type { FetchFunction } from "./core/fetcher/Fetcher";

export const DEFAULT_EVENT_CAPTURE_BASE_URL = "https://c.schematichq.com";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface EventCaptureClientOptions {
    apiKey: string;
    /** Fetcher created by the SchematicClient — reused so that offline mode,
     *  default headers, and retry/logging behavior stay consistent. */
    fetcher: FetchFunction;
    baseUrl?: string;
    timeoutMs?: number;
}

interface CapturePayload {
    api_key: string;
    type: EventType;
    body?: unknown;
    sent_at?: string;
}

interface BatchPayload {
    events: CapturePayload[];
}

const buildEndpoint = (baseUrl: string): string => {
    return baseUrl.replace(/\/+$/, "") + "/batch";
};

const toCapturePayload = (event: CreateEventRequestBody, apiKey: string): CapturePayload => {
    const payload: CapturePayload = {
        api_key: apiKey,
        type: event.eventType,
    };

    if (event.body !== undefined) {
        payload.body = serializers.EventBody.jsonOrThrow(event.body as EventBody, {
            unrecognizedObjectKeys: "strip",
        });
    }

    if (event.sentAt !== undefined) {
        payload.sent_at = event.sentAt instanceof Date ? event.sentAt.toISOString() : event.sentAt;
    }

    return payload;
};

const buildBatch = (events: CreateEventRequestBody[], apiKey: string): BatchPayload => {
    return {
        events: events.map((e) => toCapturePayload(e, apiKey)),
    };
};

const describeFetcherError = (error: unknown): string => {
    if (typeof error !== "object" || error === null || !("reason" in error)) {
        return "unknown error";
    }
    const err = error as { reason: string; statusCode?: number; errorMessage?: string; body?: unknown };
    switch (err.reason) {
        case "status-code": {
            const body = typeof err.body === "string" ? err.body : JSON.stringify(err.body ?? "");
            return `HTTP ${err.statusCode}: ${body}`;
        }
        case "timeout":
            return "request timed out";
        case "non-json":
            return `non-JSON response (HTTP ${err.statusCode})`;
        case "body-is-null":
            return `empty response body (HTTP ${err.statusCode})`;
        default:
            return err.errorMessage ?? "unknown error";
    }
};

/**
 * HTTP client for sending event batches directly to the Schematic event
 * capture service (default: https://c.schematichq.com/batch).
 */
export class EventCaptureClient {
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly timeoutMs: number;
    private readonly fetcher: FetchFunction;

    constructor(options: EventCaptureClientOptions) {
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl ?? DEFAULT_EVENT_CAPTURE_BASE_URL;
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        this.fetcher = options.fetcher;
    }

    public async sendBatch(events: CreateEventRequestBody[]): Promise<void> {
        if (events.length === 0) {
            return;
        }

        const response = await this.fetcher({
            url: buildEndpoint(this.baseUrl),
            method: "POST",
            contentType: "application/json",
            requestType: "json",
            headers: {
                "X-Schematic-Api-Key": this.apiKey,
            },
            body: buildBatch(events, this.apiKey),
            timeoutMs: this.timeoutMs,
            maxRetries: 0,
        });

        if (!response.ok) {
            throw new Error(`capture service returned ${describeFetcherError(response.error)}`);
        }
    }
}
