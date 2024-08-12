import { CreateEventRequestBody } from "./api";
import { Events } from "./api/resources/events/client/Client";
import { ConsoleLogger, Logger } from "./logger";

const DEFAULT_FLUSH_INTERVAL = 1000; // 1 second
const DEFAULT_MAX_SIZE = 1000; // 1000 items

interface EventBufferOptions {
    interval?: number;
    logger?: Logger;
    maxSize?: number;
}

class EventBuffer {
    private events: CreateEventRequestBody[] = [];
    private eventsApi: Events;
    private interval: number;
    private logger: Logger;
    private maxSize: number;
    private shutdown: boolean = false;
    private stopped: boolean = false;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(eventsApi: Events, opts?: EventBufferOptions) {
        const { logger, maxSize, interval } = opts || {};
        this.eventsApi = eventsApi;
        this.interval = interval || DEFAULT_FLUSH_INTERVAL;
        this.logger = logger || new ConsoleLogger();
        this.maxSize = maxSize || DEFAULT_MAX_SIZE;

        this.startPeriodicFlush();
    }

    public async flush(): Promise<void> {
        if (this.events.length === 0) {
            return;
        }

        const events = [...this.events];
        this.events = [];

        try {
            await this.eventsApi.createEventBatch({ events });
        } catch (err) {
            this.logger.error("Failed to flush events", err);
        }
    }

    public async push(event: CreateEventRequestBody): Promise<void> {
        if (this.stopped) {
            this.logger.error("Event buffer is stopped, not accepting new events");
            return;
        }

        if (this.events.length >= this.maxSize) {
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
        this.intervalId = setInterval(async () => {
            if (this.shutdown) return;
            await this.flush();
        }, this.interval);
    }
}

export { EventBuffer };
