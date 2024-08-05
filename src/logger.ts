/* eslint-disable */

export interface Logger {
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

class ConsoleLogger implements Logger {
  error(message: string, ...args: any[]): void {
    console.error(message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(message, ...args);
  }

  info(message: string, ...args: any[]): void {
    console.info(message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.debug(message, ...args);
  }
}

export { ConsoleLogger };
