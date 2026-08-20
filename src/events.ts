import { CreateEventRequestBody } from "./api";
import { EventCaptureClient } from "./event-capture";
import { ConsoleLogger, Logger } from "./logger";

const DEFAULT_FLUSH_INTERVAL = 1000; // 1 second
const DEFAULT_MAX_SIZE = 100; // 100 items
const DEFAULT_MAX_RETRIES = 3;
// The capture service rejects any batch larger than this with
// `400 {"error": "batch too large", "max_size": 100}`, so a flush is split
// into chunks of at most this many events regardless of how many are buffered.
const MAX_EVENTS_PER_REQUEST = 100;
const DEFAULT_INITIAL_RETRY_DELAY = 1000; // 1 second in milliseconds

interface EventBufferOptions {
    interval?: number;
    logger?: Logger;
    maxSize?: number;
    offline?: boolean;
    maxRetries?: number;
    initialRetryDelay?: number;
}

class EventBuffer {
    private events: CreateEventRequestBody[] = [];
    private captureClient: EventCaptureClient;
    private interval: number;
    private intervalId: NodeJS.Timeout | null = null;
    private logger: Logger;
    private maxSize: number;
    private offline: boolean;
    private maxRetries: number;
    private initialRetryDelay: number;
    private shutdown: boolean = false;
    private stopped: boolean = false;
    private flushing: boolean = false;  // Add flush state tracking

    constructor(captureClient: EventCaptureClient, opts?: EventBufferOptions) {
        const {
            logger = new ConsoleLogger(),
            maxSize = DEFAULT_MAX_SIZE,
            interval = DEFAULT_FLUSH_INTERVAL,
            offline = false,
            maxRetries = DEFAULT_MAX_RETRIES,
            initialRetryDelay = DEFAULT_INITIAL_RETRY_DELAY,
        } = opts || {};
        this.captureClient = captureClient;
        this.interval = interval;
        this.logger = logger;
        this.maxSize = maxSize;
        this.offline = offline;
        this.maxRetries = maxRetries;
        this.initialRetryDelay = initialRetryDelay;

        this.startPeriodicFlush();
    }

    public async flush(): Promise<void> {
        if (this.events.length === 0 || this.flushing) {
            return;
        }

        this.flushing = true;
        try {
            const events = [...this.events];
            this.events = [];

            // The buffer can hold more than one request's worth of events: a
            // caller that does not await `push` keeps appending while a flush
            // is in flight, since `push` skips its size check whenever
            // `flushing` is set. Send in chunks so an oversized buffer is
            // never turned into an oversized request.
            //
            // Each chunk is retried independently. Retrying the whole drained
            // set together would resend chunks that already succeeded.
            for (let i = 0; i < events.length; i += MAX_EVENTS_PER_REQUEST) {
                await this.sendChunk(events.slice(i, i + MAX_EVENTS_PER_REQUEST));
            }
        } finally {
            this.flushing = false;
        }
    }

    /**
     * Sends a single request's worth of events, retrying with exponential
     * backoff. Failures are logged and the chunk is dropped, matching the
     * buffer's contract that tracking never throws to the caller.
     */
    private async sendChunk(events: CreateEventRequestBody[]): Promise<void> {
        // Initialize retry counter and success flag
        let retryCount = 0;
        let success = false;
        let lastError: any = null;

        // Try with retries and exponential backoff
        while (retryCount <= this.maxRetries && !success) {
            try {
                if (retryCount > 0) {
                    // Log retry attempt
                    this.logger.info(`Retrying event batch submission (attempt ${retryCount} of ${this.maxRetries})`);
                }

                // Attempt to send events
                await this.captureClient.sendBatch(events);
                success = true;
            } catch (err) {
                lastError = err;
                retryCount++;

                if (retryCount <= this.maxRetries) {
                    // Calculate backoff with jitter
                    const delay = this.initialRetryDelay * Math.pow(2, retryCount - 1);
                    const jitter = Math.random() * 0.1 * delay; // 10% jitter
                    const waitTime = delay + jitter;

                    this.logger.warn(
                        `Event batch submission failed: ${err}. Retrying in ${(waitTime / 1000).toFixed(2)} seconds...`,
                    );

                    // Wait before retry
                    if (process.env.NODE_ENV !== "test") {
                        await new Promise((resolve) => setTimeout(resolve, waitTime));
                    }
                }
            }
        }

        // After all retries, if still not successful, log the error
        if (!success) {
            this.logger.error(`Event batch submission failed after ${this.maxRetries} retries:`, lastError);
        } else if (retryCount > 0) {
            this.logger.info(`Event batch submission succeeded after ${retryCount} retries`);
        }
    }

    public async push(event: CreateEventRequestBody): Promise<void> {
        if (this.offline) {
            return;
        }

        if (this.stopped) {
            this.logger.error("Event buffer is stopped, not accepting new events");
            return;
        }

        if (this.events.length >= this.maxSize && !this.flushing) {
            await this.flush();
        }

        this.events.push(event);
    }

    public async stop(): Promise<void> {
        this.shutdown = true;
        this.stopped = true;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        await this.flush();
    }

    private startPeriodicFlush(): void {
        if (this.offline || this.intervalId) {
            return;
        }

        this.intervalId = setInterval(async () => {
            if (this.shutdown) return;
            await this.flush();
        }, this.interval);
        if (this.intervalId.unref) this.intervalId.unref();
    }
}

export { EventBuffer };
