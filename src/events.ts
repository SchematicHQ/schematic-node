import { CreateEventRequestBody } from "./api";
import { EventsClient } from "./api/resources/events/client/Client";
import { ConsoleLogger, Logger } from "./logger";

const DEFAULT_FLUSH_INTERVAL = 1000; // 1 second
const DEFAULT_MAX_SIZE = 1000; // 1000 items
const DEFAULT_MAX_RETRIES = 3;
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
    private eventsApi: EventsClient;
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

    constructor(eventsApi: EventsClient, opts?: EventBufferOptions) {
        const {
            logger = new ConsoleLogger(),
            maxSize = DEFAULT_MAX_SIZE,
            interval = DEFAULT_FLUSH_INTERVAL,
            offline = false,
            maxRetries = DEFAULT_MAX_RETRIES,
            initialRetryDelay = DEFAULT_INITIAL_RETRY_DELAY,
        } = opts || {};
        this.eventsApi = eventsApi;
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
                    await this.eventsApi.createEventBatch({ events });
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
                            `Event batch submission failed: ${err}. Retrying in ${(waitTime / 1000).toFixed(2)} seconds...`
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
        } finally {
            this.flushing = false;
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
    }
}

export { EventBuffer };
