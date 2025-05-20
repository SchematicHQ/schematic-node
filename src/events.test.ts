/* eslint @typescript-eslint/no-explicit-any: 0 */

import { EventBuffer } from "./events";
import { Events } from "./api/resources/events/client/Client";
import { CreateEventRequestBody } from "./api";
import { Logger } from "./logger";

process.env.NODE_ENV = "test";

jest.useFakeTimers();

describe("EventBuffer", () => {
    let mockEventsApi: jest.Mocked<Events>;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(() => {
        const mockResponse = {
            data: {
                events: [],
            },
            params: {},
        };

        mockEventsApi = {
            createEventBatch: jest.fn().mockResolvedValue(mockResponse),
        } as any;

        mockLogger = {
            error: jest.fn(),
            log: jest.fn(),
            warn: jest.fn(),
            info: jest.fn(),
            debug: jest.fn(),
        } as any;
    });

    it("should push and flush events correctly", async () => {
        const event1: CreateEventRequestBody = {
            body: {
                company: { id: "test-company" },
                event: "test-event",
                user: { id: "test-user" },
            },
            eventType: "track",
            sentAt: new Date(),
        };
        const event2: CreateEventRequestBody = {
            body: {
                company: { id: "test-company" },
                event: "test-event-2",
                user: { id: "test-user" },
            },
            eventType: "track",
            sentAt: new Date(),
        };
        const buffer = new EventBuffer(mockEventsApi, {
            logger: mockLogger,
            maxSize: 1, // Set max size to 1 item
            interval: 1000,
        });

        await buffer.push(event1);

        expect(mockEventsApi.createEventBatch).not.toHaveBeenCalled();

        // Force first flush by exceeding max size
        await buffer.push(event2);

        expect(mockEventsApi.createEventBatch).toHaveBeenCalledTimes(1);
        expect(mockEventsApi.createEventBatch).toHaveBeenCalledWith({
            events: [event1],
        });

        // Wait for the next periodic flush
        jest.advanceTimersByTime(1001);
        expect(mockEventsApi.createEventBatch).toHaveBeenCalledTimes(2);
        expect(mockEventsApi.createEventBatch).toHaveBeenCalledWith({
            events: [event2],
        });
    });

    // The rest of the tests remain unchanged as they don't directly test the maxSize behavior
    it("should log error if flushing fails", async () => {
        mockEventsApi.createEventBatch.mockRejectedValue(new Error("Flush error"));

        const buffer = new EventBuffer(mockEventsApi, {
            logger: mockLogger,
            interval: 1000,
            maxRetries: 1,
            initialRetryDelay: 1,
        });

        const event: CreateEventRequestBody = {
            body: {
                company: { id: "test-company" },
                event: "test-event",
                user: { id: "test-user" },
            },
            eventType: "track",
            sentAt: new Date(),
        };
        await buffer.push(event);
        await buffer.push(event);

        // Since we're skipping delays in test environment,
        // we can just call flush directly
        await buffer.flush();

        expect(mockLogger.error).toHaveBeenCalledWith(
            "Event batch submission failed after 1 retries:",
            expect.any(Error)
        );
    });

    it("should stop accepting events after stop is called", async () => {
        const buffer = new EventBuffer(mockEventsApi, {
            interval: 1000,
            logger: mockLogger,
        });

        const event: CreateEventRequestBody = {
            body: {
                company: { id: "test-company" },
                event: "test-event",
                user: { id: "test-user" },
            },
            eventType: "track",
            sentAt: new Date(),
        };
        await buffer.push(event);

        await buffer.stop();

        await buffer.push(event);

        expect(mockLogger.error).toHaveBeenCalledWith("Event buffer is stopped, not accepting new events");
        expect(mockEventsApi.createEventBatch).toHaveBeenCalledTimes(1);
    });

    it("should periodically flush events", async () => {
        const buffer = new EventBuffer(mockEventsApi, {
            interval: 1000,
            logger: mockLogger,
        });

        const event: CreateEventRequestBody = {
            body: {
                company: { id: "test-company" },
                event: "test-event",
                user: { id: "test-user" },
            },
            eventType: "track",
            sentAt: new Date(),
        };
        await buffer.push(event);

        jest.advanceTimersByTime(1000);

        expect(mockEventsApi.createEventBatch).toHaveBeenCalledTimes(1);
        expect(mockEventsApi.createEventBatch).toHaveBeenCalledWith({
            events: [event],
        });
    });

    it("should not flush events if shutdown", async () => {
        const buffer = new EventBuffer(mockEventsApi, {
            interval: 1000,
            logger: mockLogger,
        });

        const event: CreateEventRequestBody = {
            body: {
                company: { id: "test-company" },
                event: "test-event",
                user: { id: "test-user" },
            },
            eventType: "track",
            sentAt: new Date(),
        };
        await buffer.push(event);

        buffer["shutdown"] = true;

        jest.advanceTimersByTime(1000);

        expect(mockEventsApi.createEventBatch).not.toHaveBeenCalled();
    });

    it("should retry and succeed after a failure", async () => {
        const mockResponse = {
            data: {
                events: [],
            },
            params: {},
        };

        // First call fails, second succeeds
        mockEventsApi.createEventBatch
            .mockRejectedValueOnce(new Error("Temporary failure"))
            .mockResolvedValueOnce(mockResponse);

        const buffer = new EventBuffer(mockEventsApi, {
            logger: mockLogger,
            interval: 1000,
            maxRetries: 3,
            initialRetryDelay: 1,
        });

        const event: CreateEventRequestBody = {
            body: {
                company: { id: "test-company" },
                event: "test-event",
                user: { id: "test-user" },
            },
            eventType: "track",
            sentAt: new Date(),
        };
        await buffer.push(event);

        // Since we're skipping delays in test environment,
        // we can just call flush directly
        await buffer.flush();

        // Verify that the createEventBatch was called twice (once failed, once succeeded)
        expect(mockEventsApi.createEventBatch).toHaveBeenCalledTimes(2);

        expect(mockLogger.info).toHaveBeenCalledWith("Event batch submission succeeded after 1 retries");
    });
});
