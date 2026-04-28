/* eslint @typescript-eslint/no-explicit-any: 0 */

import { EventBuffer } from "../../src/events";
import { EventCaptureClient } from "../../src/event-capture";
import { CreateEventRequestBody } from "../../src/api";
import { Logger } from "../../src/logger";

process.env.NODE_ENV = "test";

jest.useFakeTimers();

describe("EventBuffer", () => {
    let mockCaptureClient: jest.Mocked<EventCaptureClient>;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(() => {
        mockCaptureClient = {
            sendBatch: jest.fn().mockResolvedValue(undefined),
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
        const buffer = new EventBuffer(mockCaptureClient, {
            logger: mockLogger,
            maxSize: 1, // Set max size to 1 item
            interval: 1000,
        });

        await buffer.push(event1);

        expect(mockCaptureClient.sendBatch).not.toHaveBeenCalled();

        // Force first flush by exceeding max size
        await buffer.push(event2);

        expect(mockCaptureClient.sendBatch).toHaveBeenCalledTimes(1);
        expect(mockCaptureClient.sendBatch).toHaveBeenCalledWith([event1]);

        // Wait for the next periodic flush
        jest.advanceTimersByTime(1001);
        expect(mockCaptureClient.sendBatch).toHaveBeenCalledTimes(2);
        expect(mockCaptureClient.sendBatch).toHaveBeenCalledWith([event2]);
    });

    // The rest of the tests remain unchanged as they don't directly test the maxSize behavior
    it("should log error if flushing fails", async () => {
        mockCaptureClient.sendBatch.mockRejectedValue(new Error("Flush error"));

        const buffer = new EventBuffer(mockCaptureClient, {
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
        const buffer = new EventBuffer(mockCaptureClient, {
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
        expect(mockCaptureClient.sendBatch).toHaveBeenCalledTimes(1);
    });

    it("should periodically flush events", async () => {
        const buffer = new EventBuffer(mockCaptureClient, {
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

        expect(mockCaptureClient.sendBatch).toHaveBeenCalledTimes(1);
        expect(mockCaptureClient.sendBatch).toHaveBeenCalledWith([event]);
    });

    it("should not flush events if shutdown", async () => {
        const buffer = new EventBuffer(mockCaptureClient, {
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

        expect(mockCaptureClient.sendBatch).not.toHaveBeenCalled();
    });

    it("should handle track events with quantity", async () => {
        const event: CreateEventRequestBody = {
            body: {
                company: { id: "test-company" },
                event: "test-event",
                user: { id: "test-user" },
                quantity: 5,
            },
            eventType: "track",
            sentAt: new Date(),
        };
        const buffer = new EventBuffer(mockCaptureClient, {
            logger: mockLogger,
            interval: 1000,
        });

        await buffer.push(event);

        jest.advanceTimersByTime(1000);

        expect(mockCaptureClient.sendBatch).toHaveBeenCalledTimes(1);
        expect(mockCaptureClient.sendBatch).toHaveBeenCalledWith([event]);

        const sentEvents = mockCaptureClient.sendBatch.mock.calls[0][0];
        expect(sentEvents[0].body).toHaveProperty("quantity", 5);
    });

    it("should drop events silently in offline mode", async () => {
        const buffer = new EventBuffer(mockCaptureClient, {
            logger: mockLogger,
            interval: 1000,
            offline: true,
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

        // push() should not throw in offline mode
        await expect(buffer.push(event)).resolves.not.toThrow();

        jest.advanceTimersByTime(1000);

        // Events should never be sent in offline mode
        expect(mockCaptureClient.sendBatch).not.toHaveBeenCalled();
    });

    it("should retry and succeed after a failure", async () => {
        // First call fails, second succeeds
        mockCaptureClient.sendBatch
            .mockRejectedValueOnce(new Error("Temporary failure"))
            .mockResolvedValueOnce(undefined);

        const buffer = new EventBuffer(mockCaptureClient, {
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

        // Verify that sendBatch was called twice (once failed, once succeeded)
        expect(mockCaptureClient.sendBatch).toHaveBeenCalledTimes(2);

        expect(mockLogger.info).toHaveBeenCalledWith("Event batch submission succeeded after 1 retries");
    });
});
