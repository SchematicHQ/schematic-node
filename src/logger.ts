/* eslint-disable */

export const LogLevel = {
    Debug: "debug",
    Info: "info",
    Warn: "warn",
    Error: "error",
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    [LogLevel.Debug]: 1,
    [LogLevel.Info]: 2,
    [LogLevel.Warn]: 3,
    [LogLevel.Error]: 4,
};

/**
 * Default level for the built-in ConsoleLogger. Messages below this level
 * (i.e. debug and info) are suppressed unless the consumer opts in via the
 * `logLevel` option, keeping production output quiet by default.
 */
export const DEFAULT_LOG_LEVEL: LogLevel = LogLevel.Warn;

export interface Logger {
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}

/**
 * Console-based Logger that filters messages by configured level. Defaults to
 * `warn`, so debug/info are dropped unless a lower level is requested.
 */
class ConsoleLogger implements Logger {
    private readonly level: number;

    constructor(level: LogLevel = DEFAULT_LOG_LEVEL) {
        this.level = LOG_LEVEL_PRIORITY[level] ?? LOG_LEVEL_PRIORITY[DEFAULT_LOG_LEVEL];
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVEL_PRIORITY[level] >= this.level;
    }

    error(message: string, ...args: any[]): void {
        if (this.shouldLog(LogLevel.Error)) {
            console.error(message, ...args);
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.shouldLog(LogLevel.Warn)) {
            console.warn(message, ...args);
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.shouldLog(LogLevel.Info)) {
            console.info(message, ...args);
        }
    }

    debug(message: string, ...args: any[]): void {
        if (this.shouldLog(LogLevel.Debug)) {
            console.debug(message, ...args);
        }
    }
}

export { ConsoleLogger };
