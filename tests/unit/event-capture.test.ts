/* eslint @typescript-eslint/no-explicit-any: 0 */

import { CreateEventRequestBody } from "../../src/api";
import {
    DEFAULT_EVENT_CAPTURE_BASE_URL,
    EventCaptureClient,
} from "../../src/event-capture";
import type { FetchFunction } from "../../src/core/fetcher/Fetcher";

describe("EventCaptureClient", () => {
    const apiKey = "test-api-key";

    const buildEvent = (overrides?: Partial<CreateEventRequestBody>): CreateEventRequestBody => ({
        body: {
            company: { id: "company-1" },
            event: "test-event",
            user: { id: "user-1" },
            quantity: 2,
        },
        eventType: "track",
        sentAt: new Date("2026-04-28T12:00:00.000Z"),
        ...overrides,
    });

    const okResponse = { ok: true, body: {}, headers: {}, rawResponse: {} as any };

    const makeFetcher = (impl?: (...args: any[]) => any): jest.MockedFunction<FetchFunction> => {
        const fn = jest.fn(impl ?? (() => Promise.resolve(okResponse))) as unknown as jest.MockedFunction<FetchFunction>;
        return fn;
    };

    it("should POST a snake_case batch payload to /batch with auth header", async () => {
        const fetcher = makeFetcher();
        const client = new EventCaptureClient({ apiKey, fetcher });

        const event = buildEvent();
        await client.sendBatch([event]);

        expect(fetcher).toHaveBeenCalledTimes(1);
        const args = fetcher.mock.calls[0][0];

        expect(args.url).toBe(`${DEFAULT_EVENT_CAPTURE_BASE_URL}/batch`);
        expect(args.method).toBe("POST");
        expect(args.contentType).toBe("application/json");
        expect(args.requestType).toBe("json");
        expect(args.headers).toEqual(
            expect.objectContaining({
                "X-Schematic-Api-Key": apiKey,
            }),
        );
        // Buffer-level retries are authoritative; the fetcher should not retry.
        expect(args.maxRetries).toBe(0);

        expect(args.body).toEqual({
            events: [
                {
                    api_key: apiKey,
                    type: "track",
                    body: {
                        company: { id: "company-1" },
                        event: "test-event",
                        user: { id: "user-1" },
                        quantity: 2,
                    },
                    sent_at: "2026-04-28T12:00:00.000Z",
                },
            ],
        });
    });

    it("should serialize multiple events including identify and flag_check types", async () => {
        const fetcher = makeFetcher();
        const client = new EventCaptureClient({ apiKey, fetcher });

        const events: CreateEventRequestBody[] = [
            {
                eventType: "identify",
                body: {
                    keys: { id: "user-1" },
                    name: "Test User",
                },
                sentAt: new Date("2026-04-28T12:00:00.000Z"),
            },
            {
                eventType: "flag_check",
                body: {
                    flagKey: "feature-x",
                    value: true,
                    reason: "rule match",
                },
                sentAt: new Date("2026-04-28T12:00:01.000Z"),
            },
        ];

        await client.sendBatch(events);

        const args = fetcher.mock.calls[0][0];
        const body = args.body as { events: any[] };

        expect(body.events).toHaveLength(2);
        expect(body.events[0]).toMatchObject({
            api_key: apiKey,
            type: "identify",
            body: expect.objectContaining({ name: "Test User" }),
        });
        expect(body.events[1]).toMatchObject({
            api_key: apiKey,
            type: "flag_check",
            // flag_check body fields use snake_case via the generated serializer
            body: expect.objectContaining({
                flag_key: "feature-x",
                value: true,
                reason: "rule match",
            }),
        });
    });

    it("should forward SDK identifying headers alongside the auth header", async () => {
        const fetcher = makeFetcher();
        const sdkHeaders = {
            "X-Fern-Language": "JavaScript",
            "X-Fern-SDK-Name": "test-sdk-name",
            "X-Fern-SDK-Version": "test-sdk-version",
            "User-Agent": "test-user-agent",
        };
        const client = new EventCaptureClient({ apiKey, fetcher, headers: sdkHeaders });

        await client.sendBatch([buildEvent()]);

        const headers = fetcher.mock.calls[0][0].headers as Record<string, string>;
        for (const key of Object.keys(sdkHeaders)) {
            expect(headers[key]).toBeDefined();
            expect(headers[key]).not.toBeNull();
            expect(headers[key]).not.toBe("");
        }
        expect(headers["X-Schematic-Api-Key"]).toBe(apiKey);
    });

    it("should let the auth header override any caller-provided X-Schematic-Api-Key", async () => {
        const fetcher = makeFetcher();
        const client = new EventCaptureClient({
            apiKey,
            fetcher,
            headers: { "X-Schematic-Api-Key": "wrong-key" },
        });

        await client.sendBatch([buildEvent()]);

        const args = fetcher.mock.calls[0][0];
        expect((args.headers as Record<string, string>)["X-Schematic-Api-Key"]).toBe(apiKey);
    });

    it("should respect a custom base URL and strip trailing slashes", async () => {
        const fetcher = makeFetcher();
        const client = new EventCaptureClient({
            apiKey,
            fetcher,
            baseUrl: "https://custom.example.com/",
        });

        await client.sendBatch([buildEvent()]);

        const args = fetcher.mock.calls[0][0];
        expect(args.url).toBe("https://custom.example.com/batch");
    });

    it("should be a no-op when sending an empty batch", async () => {
        const fetcher = makeFetcher();
        const client = new EventCaptureClient({ apiKey, fetcher });

        await client.sendBatch([]);

        expect(fetcher).not.toHaveBeenCalled();
    });

    it("should throw when the capture service returns a non-2xx response", async () => {
        const fetcher = makeFetcher(() =>
            Promise.resolve({
                ok: false,
                error: { reason: "status-code", statusCode: 500, body: "boom" },
                rawResponse: {} as any,
            }),
        );
        const client = new EventCaptureClient({ apiKey, fetcher });

        await expect(client.sendBatch([buildEvent()])).rejects.toThrow(
            "capture service returned HTTP 500: boom",
        );
    });

    it("should surface fetcher timeouts", async () => {
        const fetcher = makeFetcher(() =>
            Promise.resolve({
                ok: false,
                error: { reason: "timeout" },
                rawResponse: {} as any,
            }),
        );
        const client = new EventCaptureClient({ apiKey, fetcher });

        await expect(client.sendBatch([buildEvent()])).rejects.toThrow(
            "capture service returned request timed out",
        );
    });

    it("should surface unknown fetcher errors", async () => {
        const fetcher = makeFetcher(() =>
            Promise.resolve({
                ok: false,
                error: { reason: "unknown", errorMessage: "network down" },
                rawResponse: {} as any,
            }),
        );
        const client = new EventCaptureClient({ apiKey, fetcher });

        await expect(client.sendBatch([buildEvent()])).rejects.toThrow(
            "capture service returned network down",
        );
    });

    it("should omit body when the event has no body", async () => {
        const fetcher = makeFetcher();
        const client = new EventCaptureClient({ apiKey, fetcher });

        await client.sendBatch([
            {
                eventType: "track",
                sentAt: new Date("2026-04-28T12:00:00.000Z"),
            } as CreateEventRequestBody,
        ]);

        const args = fetcher.mock.calls[0][0];
        const batch = args.body as { events: any[] };
        expect(batch.events[0]).not.toHaveProperty("body");
        expect(batch.events[0]).toEqual({
            api_key: apiKey,
            type: "track",
            sent_at: "2026-04-28T12:00:00.000Z",
        });
    });
});
