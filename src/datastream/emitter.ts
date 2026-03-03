/**
 * Minimal interface for the subset of EventEmitter we use.
 * Avoids importing the Node.js `events` module at the top level
 * so that edge runtimes (Cloudflare Workers, etc.) can load the
 * module graph without error.
 */
export interface Emitter {
  on(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): boolean;
  removeAllListeners(event?: string): void;
}

/**
 * Mixin base class that provides lazy-loaded EventEmitter composition.
 * The Node.js `events` module is only required the first time a listener
 * is registered or an event is emitted, keeping the import out of the
 * module-level dependency graph.
 */
export class LazyEmitter {
  private _emitter: Emitter | null = null;

  private ensureEmitter(): Emitter {
    if (!this._emitter) {
      const { EventEmitter } = require('events');
      this._emitter = new EventEmitter() as Emitter;
    }
    return this._emitter;
  }

  public on(event: string, listener: (...args: any[]) => void): this {
    this.ensureEmitter().on(event, listener);
    return this;
  }

  public emit(event: string, ...args: any[]): boolean {
    return this._emitter?.emit(event, ...args) ?? false;
  }

  public removeAllListeners(event?: string): this {
    this._emitter?.removeAllListeners(event);
    return this;
  }
}
