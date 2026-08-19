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
            expect.any(Error),
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

    describe("batch size cap", () => {
        const makeEvent = (n: number): CreateEventRequestBody => ({
            body: {
                company: { id: "test-company" },
                event: `test-event-${n}`,
                user: { id: "test-user" },
            },
            eventType: "track",
            sentAt: new Date(),
        });

        const batchSizes = () => mockCaptureClient.sendBatch.mock.calls.map((call) => call[0].length);

        it("splits a drained buffer into requests of at most 100 events", async () => {
            const buffer = new EventBuffer(mockCaptureClient, {
                logger: mockLogger,
                // Deliberately larger than the server's cap, to prove the cap
                // is enforced at send time rather than by the buffer size.
                maxSize: 1000,
                interval: 1000,
            });

            for (let i = 0; i < 250; i++) {
                await buffer.push(makeEvent(i));
            }
            await buffer.flush();

            expect(batchSizes()).toEqual([100, 100, 50]);
        });

        it("never sends more than 100 events when pushes are not awaited", async () => {
            // Reproduces the original failure. `push` skips its size check
            // while a flush is in flight, so a caller that fires `track()`
            // without awaiting keeps appending for the whole duration of the
            // in-flight request. Hold the first request open so the buffer
            // grows well past the cap before it is drained again.
            let releaseFirstSend: () => void = () => undefined;
            const firstSendHeld = new Promise<void>((resolve) => {
                releaseFirstSend = resolve;
            });
            mockCaptureClient.sendBatch.mockImplementationOnce(() => firstSendHeld);

            const buffer = new EventBuffer(mockCaptureClient, {
                logger: mockLogger,
                maxSize: 100,
                interval: 1000,
            });

            const pushes = Promise.all(Array.from({ length: 300 }, (_, i) => buffer.push(makeEvent(i))));
            // Let every push run up to the point where it appends or blocks.
            await Promise.resolve();
            releaseFirstSend();
            await pushes;
            await buffer.stop();

            expect(mockCaptureClient.sendBatch).toHaveBeenCalled();
            for (const size of batchSizes()) {
                expect(size).toBeLessThanOrEqual(100);
            }
            const total = batchSizes().reduce((sum, size) => sum + size, 0);
            expect(total).toBe(300);
        });

        it("does not resend a delivered chunk when a later chunk fails", async () => {
            mockCaptureClient.sendBatch
                .mockResolvedValueOnce(undefined) // chunk 1 delivered
                .mockRejectedValue(new Error("boom")); // chunk 2 fails every attempt

            const buffer = new EventBuffer(mockCaptureClient, {
                logger: mockLogger,
                maxSize: 1000,
                interval: 1000,
                maxRetries: 2,
                initialRetryDelay: 1,
            });

            for (let i = 0; i < 150; i++) {
                await buffer.push(makeEvent(i));
            }
            await buffer.flush();

            // 1 delivery for chunk 1, then 1 + 2 retries for chunk 2.
            expect(mockCaptureClient.sendBatch).toHaveBeenCalledTimes(4);

            const firstChunk = mockCaptureClient.sendBatch.mock.calls[0][0];
            const resends = mockCaptureClient.sendBatch.mock.calls.filter((call) => call[0] === firstChunk);
            expect(resends).toHaveLength(1);
        });

        it("still attempts later chunks after an earlier chunk fails", async () => {
            mockCaptureClient.sendBatch.mockRejectedValueOnce(new Error("boom")).mockResolvedValue(undefined);

            const buffer = new EventBuffer(mockCaptureClient, {
                logger: mockLogger,
                maxSize: 1000,
                interval: 1000,
                maxRetries: 0,
                initialRetryDelay: 1,
            });

            for (let i = 0; i < 150; i++) {
                await buffer.push(makeEvent(i));
            }
            await buffer.flush();

            expect(batchSizes()).toEqual([100, 50]);
        });
    });
});
