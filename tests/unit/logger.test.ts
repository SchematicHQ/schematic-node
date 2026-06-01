import { ConsoleLogger, DEFAULT_LOG_LEVEL, LogLevel } from "../../src/logger";

describe("ConsoleLogger (consumer-facing)", () => {
    let consoleSpy: {
        debug: ReturnType<typeof jest.spyOn>;
        info: ReturnType<typeof jest.spyOn>;
        warn: ReturnType<typeof jest.spyOn>;
        error: ReturnType<typeof jest.spyOn>;
    };

    beforeEach(() => {
        consoleSpy = {
            debug: jest.spyOn(console, "debug").mockImplementation(() => {}),
            info: jest.spyOn(console, "info").mockImplementation(() => {}),
            warn: jest.spyOn(console, "warn").mockImplementation(() => {}),
            error: jest.spyOn(console, "error").mockImplementation(() => {}),
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should default to the warn level", () => {
        expect(DEFAULT_LOG_LEVEL).toBe(LogLevel.Warn);
    });

    it("should suppress debug and info but emit warn and error by default", () => {
        const logger = new ConsoleLogger();

        logger.debug("debug");
        logger.info("info");
        logger.warn("warn");
        logger.error("error");

        expect(consoleSpy.debug).not.toHaveBeenCalled();
        expect(consoleSpy.info).not.toHaveBeenCalled();
        expect(consoleSpy.warn).toHaveBeenCalledWith("warn");
        expect(consoleSpy.error).toHaveBeenCalledWith("error");
    });

    it("should emit every level when configured to debug", () => {
        const logger = new ConsoleLogger(LogLevel.Debug);

        logger.debug("debug", { a: 1 });
        logger.info("info");
        logger.warn("warn");
        logger.error("error");

        expect(consoleSpy.debug).toHaveBeenCalledWith("debug", { a: 1 });
        expect(consoleSpy.info).toHaveBeenCalledWith("info");
        expect(consoleSpy.warn).toHaveBeenCalledWith("warn");
        expect(consoleSpy.error).toHaveBeenCalledWith("error");
    });

    it("should only emit error when configured to error", () => {
        const logger = new ConsoleLogger(LogLevel.Error);

        logger.debug("debug");
        logger.info("info");
        logger.warn("warn");
        logger.error("error");

        expect(consoleSpy.debug).not.toHaveBeenCalled();
        expect(consoleSpy.info).not.toHaveBeenCalled();
        expect(consoleSpy.warn).not.toHaveBeenCalled();
        expect(consoleSpy.error).toHaveBeenCalledWith("error");
    });

    it("should emit info, warn, and error when configured to info", () => {
        const logger = new ConsoleLogger(LogLevel.Info);

        logger.debug("debug");
        logger.info("info");
        logger.warn("warn");
        logger.error("error");

        expect(consoleSpy.debug).not.toHaveBeenCalled();
        expect(consoleSpy.info).toHaveBeenCalledWith("info");
        expect(consoleSpy.warn).toHaveBeenCalledWith("warn");
        expect(consoleSpy.error).toHaveBeenCalledWith("error");
    });
});
