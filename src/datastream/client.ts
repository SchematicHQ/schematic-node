// Note: This client is designed for Node.js server environments only
// The ws package is required and provides the WebSocket implementation

import { EventEmitter } from 'events';
import { DataStreamResp } from './types';

// Dynamic imports to avoid webpack issues
const createWebSocket = () => {
  try {
    const WebSocketClass = require('ws');
    return WebSocketClass;
  } catch (e) {
    throw new Error('WebSocket client requires Node.js environment with ws package installed: npm install ws');
  }
};

const createURL = () => {
  try {
    return require('url').URL;
  } catch (e) {
    throw new Error('URL implementation not available in this environment');
  }
};

/**
 * WebSocket configuration constants
 */
const WRITE_WAIT = 10 * 1000; // 10 seconds in milliseconds
const PONG_WAIT = 60 * 1000; // 60 seconds
const PING_PERIOD = (PONG_WAIT * 9) / 10;
const MAX_RECONNECT_ATTEMPTS = 10;
const MIN_RECONNECT_DELAY = 1 * 1000; // 1 second
const MAX_RECONNECT_DELAY = 30 * 1000; // 30 seconds

/**
 * Logger interface for logging datastream events
 */
export interface Logger {
  debug(ctx: any, message: string, ...args: any[]): void;
  info(ctx: any, message: string, ...args: any[]): void;
  warn(ctx: any, message: string, ...args: any[]): void;
  error(ctx: any, message: string, ...args: any[]): void;
}

/**
 * MessageHandlerFunc is a function type for handling incoming datastream messages
 * Expects parsed DataStreamResp messages
 */
export type MessageHandlerFunc = (ctx: any, message: DataStreamResp) => Promise<void>;

/**
 * ConnectionReadyHandlerFunc is a function type for functions that need to be called before connection is considered ready
 */
export type ConnectionReadyHandlerFunc = (ctx: any) => Promise<void>;

/**
 * ClientOptions contains configuration for the datastream client
 */
export interface ClientOptions {
  /** HTTP API URL or WebSocket URL - HTTP URLs will be automatically converted to WebSocket URLs */
  url: string;
  /** Schematic API key for authentication */
  apiKey: string;
  /** Handler for incoming messages */
  messageHandler: MessageHandlerFunc;
  /** Handler called when connection is ready */
  connectionReadyHandler?: ConnectionReadyHandlerFunc;
  /** Logger for debug/info/error messages */
  logger?: Logger;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Minimum delay between reconnection attempts */
  minReconnectDelay?: number;
  /** Maximum delay between reconnection attempts */
  maxReconnectDelay?: number;
}

/**
 * convertAPIURLToWebSocketURL converts an API URL to a WebSocket datastream URL
 * Examples:
 *   https://api.schematichq.com -> wss://datastream.schematichq.com/datastream
 *   https://api.staging.example.com -> wss://datastream.staging.example.com/datastream
 *   https://custom.example.com -> wss://custom.example.com/datastream
 *   http://localhost:8080 -> ws://localhost:8080/datastream
 */
function convertAPIURLToWebSocketURL(apiURL: string): any {
  const URLClass = createURL();
  const parsedURL = new URLClass(apiURL);

  // Convert HTTP schemes to WebSocket schemes
  switch (parsedURL.protocol) {
    case 'https:':
      parsedURL.protocol = 'wss:';
      break;
    case 'http:':
      parsedURL.protocol = 'ws:';
      break;
    default:
      throw new Error(`Unsupported scheme: ${parsedURL.protocol} (must be http: or https:)`);
  }

  // Replace 'api' subdomain with 'datastream' if present
  if (parsedURL.hostname) {
    const hostParts = parsedURL.hostname.split('.');
    if (hostParts.length > 1 && hostParts[0] === 'api') {
      hostParts[0] = 'datastream';
      parsedURL.hostname = hostParts.join('.');
    }
  }

  // Add datastream path
  parsedURL.pathname = '/datastream';

  return parsedURL;
}

/**
 * DatastreamWSClient represents a Schematic datastream websocket client with automatic reconnection
 */
export class DatastreamWSClient extends EventEmitter {
  // Configuration
  private readonly url: any;
  private readonly headers: Record<string, string>;
  private readonly logger?: Logger;
  private readonly messageHandler: MessageHandlerFunc;
  private readonly connectionReadyHandler?: ConnectionReadyHandlerFunc;
  private readonly maxReconnectAttempts: number;
  private readonly minReconnectDelay: number;
  private readonly maxReconnectDelay: number;

  // Connection state
  private ws?: any;
  private connected: boolean = false;
  private ready: boolean = false;

  // Control state
  private shouldReconnect: boolean = true;
  private reconnectAttempts: number = 0;
  private pingInterval?: NodeJS.Timeout;
  private pongTimeout?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;

  // Context
  private ctx: any = {};

  constructor(options: ClientOptions) {
    super();

    if (!options.url) {
      throw new Error('URL is required');
    }

    if (!options.apiKey) {
      throw new Error('ApiKey is required');
    }

    if (!options.messageHandler) {
      throw new Error('MessageHandler is required');
    }

    // Auto-detect if this is an HTTP/HTTPS URL that needs conversion to WebSocket
    if (options.url.startsWith('http://') || options.url.startsWith('https://')) {
      this.url = convertAPIURLToWebSocketURL(options.url);
    } else {
      const URLClass = createURL();
      this.url = new URLClass(options.url);
    }

    // Create headers with API key
    this.headers = {
      'X-Schematic-Api-Key': options.apiKey,
    };

    this.logger = options.logger;
    this.messageHandler = options.messageHandler;
    this.connectionReadyHandler = options.connectionReadyHandler;

    // Set defaults
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? MAX_RECONNECT_ATTEMPTS;
    this.minReconnectDelay = options.minReconnectDelay ?? MIN_RECONNECT_DELAY;
    this.maxReconnectDelay = options.maxReconnectDelay ?? MAX_RECONNECT_DELAY;
  }

  /**
   * Start begins the WebSocket connection and message handling
   */
  public start(): void {
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.connectAndRead();
  }

  /**
   * IsConnected returns whether the WebSocket is currently connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * IsReady returns whether the datastream client is ready (connected + initialized)
   */
  public isReady(): boolean {
    return this.ready && this.connected;
  }

  /**
   * SendMessage sends a message through the WebSocket connection
   */
  public async sendMessage(message: any): Promise<void> {
    if (!this.isConnected() || !this.ws) {
      throw new Error('WebSocket connection is not available!');
    }

    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket connection is not available!'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Write timeout'));
      }, WRITE_WAIT);

      try {
        this.ws.send(JSON.stringify(message), (err: Error | undefined) => {
          clearTimeout(timeout);
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  }

  /**
   * Close gracefully closes the WebSocket connection
   */
  public close(): void {
    this.log('info', 'Closing WebSocket client');

    this.shouldReconnect = false;
    this.setReady(false);
    this.setConnected(false);

    // Clear all timeouts
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = undefined;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    // Close WebSocket connection
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    this.log('info', 'WebSocket client closed');
  }

  /**
   * connectAndRead handles the main connection lifecycle
   */
  private async connectAndRead(): Promise<void> {
    try {
      while (this.shouldReconnect) {
        try {
          const ws = await this.connect();
          this.log('info', 'Connected to WebSocket');
          
          this.reconnectAttempts = 0;
          this.ws = ws;
          this.setConnected(true);

          // Set up message handlers
          this.setupWebSocketHandlers(ws);

          // Call connection ready handler if provided
          if (this.connectionReadyHandler) {
            this.log('debug', 'Calling connection ready handler');
            try {
              await this.connectionReadyHandler(this.ctx);
              this.log('debug', 'Connection ready handler completed successfully');
            } catch (err) {
              this.log('error', `Connection ready handler failed: ${err}`);
              this.setConnected(false);
              this.setReady(false);
              ws.close();
              continue;
            }
          }

          // Mark as ready only after successful initialization
          this.setReady(true);
          this.log('info', 'Datastream client is ready');

          // Start ping/pong mechanism
          this.startPingPong();

          // Wait for connection to close or error
          await new Promise<void>((resolve) => {
            const onClose = () => {
              this.log('info', 'WebSocket connection closed');
              this.cleanup();
              resolve();
            };

            const onError = (error: Error) => {
              this.log('error', `WebSocket error: ${error.message}`);
              this.emit('error', error);
              this.cleanup();
              resolve();
            };

            ws.on('close', onClose);
            ws.on('error', onError);
          });

          if (!this.shouldReconnect) {
            break;
          }

          this.log('info', 'Reconnecting to WebSocket...');

        } catch (err) {
          this.log('error', `Failed to connect to WebSocket: ${err}`);
          this.reconnectAttempts++;
          this.setConnected(false);
          this.setReady(false);

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.log('error', 'Max reconnection attempts reached');
            this.emit('error', new Error('Max reconnection attempts reached'));
            break;
          }

          const delay = this.calculateBackoffDelay(this.reconnectAttempts);
          this.log('info', `Retrying WebSocket connection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

          await new Promise(resolve => {
            this.reconnectTimeout = setTimeout(resolve, delay);
          });
        }
      }
    } catch (err) {
      this.log('error', `Fatal error in connectAndRead: ${err}`);
      this.emit('error', err);
    }
  }

  /**
   * connect establishes the WebSocket connection
   */
  private connect(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.log('debug', `Attempting to dial WebSocket URL: ${this.url.toString()}`);

      const WebSocketClass = createWebSocket();
      const ws = new WebSocketClass(this.url.toString(), {
        headers: this.headers,
        handshakeTimeout: 30000, // 30 seconds
      });

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 30000);

      ws.on('open', () => {
        clearTimeout(timeout);
        this.log('info', `Successfully established WebSocket connection to ${this.url.toString()}`);
        resolve(ws);
      });

      ws.on('error', (error: Error) => {
        clearTimeout(timeout);
        this.log('error', `Failed to dial WebSocket: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * setupWebSocketHandlers sets up message and error handlers for the WebSocket
   */
  private setupWebSocketHandlers(ws: any): void {
    ws.on('message', (data: any) => {
      this.handleMessage(data);
    });

    ws.on('pong', () => {
      this.handlePong();
    });

    ws.on('close', (code: number, reason: Buffer) => {
      this.log('debug', `WebSocket closed with code ${code}: ${reason.toString()}`);
      this.handleClose(code);
    });

    ws.on('error', (error: Error) => {
      this.log('error', `WebSocket error: ${error.message}`);
      this.handleError(error);
    });
  }

  /**
   * handleMessage processes incoming WebSocket messages
   */
  private async handleMessage(data: any): Promise<void> {
    try {
      this.log('debug', 'Waiting for WebSocket message...');
      
      let messageStr: string;
      if (Buffer.isBuffer(data)) {
        messageStr = data.toString();
      } else if (Array.isArray(data)) {
        messageStr = Buffer.concat(data).toString();
      } else {
        messageStr = data.toString();
      }

      // Parse the datastream message
      let message: DataStreamResp;
      try {
        message = JSON.parse(messageStr);
      } catch (err) {
        this.log('error', `Failed to parse datastream message: ${err}, raw data: ${messageStr}`);
        this.emit('error', new Error(`Failed to parse datastream message: ${err}`));
        return;
      }

      this.log('debug', `Parsed message - EntityType: ${message.entity_type}, MessageType: ${message.message_type}, DataLength: ${JSON.stringify(message.data).length}`);

      // Handle the parsed message using the provided handler
      this.log('debug', 'Calling message handler...');
      try {
        await this.messageHandler(this.ctx, message);
        this.log('debug', 'Message handler completed successfully');
      } catch (err) {
        this.log('error', `Message handler error: ${err}`);
        this.emit('error', new Error(`Message handler error: ${err}`));
      }
    } catch (err) {
      this.log('error', `Error in handleMessage: ${err}`);
      this.emit('error', err);
    }
  }

  /**
   * handleClose processes WebSocket close events
   */
  private handleClose(code: number): void {
    this.log('debug', `Processing WebSocket close with code: ${code}`);
    this.setConnected(false);
    this.setReady(false);
    this.cleanup();

    // Normal closure codes that shouldn't trigger reconnection
    if (code === 1000 || code === 1001) {
      this.log('debug', `Normal WebSocket close detected: ${code}`);
      return;
    }

    // Trigger reconnection for other close codes
    this.log('debug', `Unexpected WebSocket close: ${code}, will attempt reconnection`);
  }

  /**
   * handleError processes WebSocket error events
   */
  private handleError(error: Error): void {
    this.log('debug', `Processing WebSocket error: ${error.message}`);
    this.setConnected(false);
    this.setReady(false);
    this.cleanup();
  }

  /**
   * startPingPong initiates the ping/pong keepalive mechanism
   */
  private startPingPong(): void {
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, PING_PERIOD);
  }

  /**
   * sendPing sends a ping message to keep the connection alive
   */
  private sendPing(): void {
    if (!this.ws) {
      this.log('error', 'No connection available for ping');
      return;
    }

    this.log('debug', 'Sending ping');
    
    // Set pong timeout
    this.pongTimeout = setTimeout(() => {
      this.log('error', 'Pong timeout - connection may be dead');
      this.setConnected(false);
      if (this.ws) {
        this.ws.close();
      }
    }, PONG_WAIT);

    try {
      this.ws.ping();
    } catch (err) {
      this.log('error', `Failed to send ping: ${err}`);
      this.setConnected(false);
    }
  }

  /**
   * handlePong handles pong responses from the server
   */
  private handlePong(): void {
    this.log('debug', 'Received pong');
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = undefined;
    }
  }

  /**
   * calculateBackoffDelay calculates exponential backoff delay with jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    // Add jitter to prevent synchronized reconnection attempts
    const jitter = Math.floor(Math.random() * this.minReconnectDelay);
    
    // Exponential backoff with a cap
    const delay = Math.pow(2, attempt - 1) * this.minReconnectDelay + jitter;
    return Math.min(delay, this.maxReconnectDelay + jitter);
  }

  /**
   * setConnected updates the connection state
   */
  private setConnected(connected: boolean): void {
    const wasConnected = this.connected;
    this.connected = connected;
    
    // If disconnected, also set ready to false
    if (!connected) {
      this.ready = false;
    }

    // Emit connection state change events
    if (wasConnected !== connected) {
      if (connected) {
        this.emit('connected');
      } else {
        this.emit('disconnected');
      }
    }
  }

  /**
   * setReady updates the ready state
   */
  private setReady(ready: boolean): void {
    const wasReady = this.ready;
    this.ready = ready;

    // Emit ready state change events
    if (wasReady !== ready) {
      if (ready) {
        this.emit('ready');
      } else {
        this.emit('not-ready');
      }
    }
  }

  /**
   * cleanup clears timeouts and intervals
   */
  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = undefined;
    }
  }

  /**
   * log helper function that safely logs messages
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', msg: string): void {
    if (!this.logger) {
      return;
    }

    const ctx = this.ctx || {};

    switch (level) {
      case 'debug':
        this.logger.debug(ctx, msg);
        break;
      case 'info':
        this.logger.info(ctx, msg);
        break;
      case 'warn':
        this.logger.warn(ctx, msg);
        break;
      case 'error':
        this.logger.error(ctx, msg);
        break;
    }
  }
}