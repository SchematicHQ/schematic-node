// Note: This client is designed for Node.js server environments only
// The ws package is required and provides the WebSocket implementation

import { EventEmitter } from 'events';
import { DataStreamResp } from './types';
import { Logger } from '../logger';

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
  logger: Logger;
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
  private readonly logger: Logger;
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
    this.logger.info('Closing WebSocket connection');

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

  }

  /**
   * connectAndRead handles the main connection lifecycle
   */
  private async connectAndRead(): Promise<void> {
    try {
      while (this.shouldReconnect) {
        try {
          const ws = await this.connect();
          
          this.reconnectAttempts = 0;
          this.ws = ws;
          this.setConnected(true);

          // Set up message handlers
          this.setupWebSocketHandlers(ws);

          // Call connection ready handler if provided
          if (this.connectionReadyHandler) {
            try {
              await this.connectionReadyHandler(this.ctx);
              this.logger.debug('Connection ready handler completed successfully');
            } catch (err) {
              this.logger.error(`Connection ready handler failed: ${err}`);
              this.setConnected(false);
              this.setReady(false);
              ws.close();
              continue;
            }
          }

          // Mark as ready only after successful initialization
          this.setReady(true);
          this.logger.debug('WebSocket client is ready');

          // Start ping/pong mechanism
          this.startPingPong();

          // Wait for connection to close or error
          await new Promise<void>((resolve) => {
            const onClose = () => {
              this.logger.info('WebSocket connection closed');
              this.cleanup();
              resolve();
            };

            const onError = (error: Error) => {
              this.logger.error(`WebSocket error: ${error.message}`);
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


        } catch (err) {
          this.reconnectAttempts++;
          this.setConnected(false);
          this.setReady(false);

          const error = err instanceof Error ? err.message : String(err);
          this.logger.warn(`WebSocket connection failed: ${error}, attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error('Max reconnection attempts reached');
            this.emit('error', new Error('Max reconnection attempts reached'));
            break;
          }

          const delay = this.calculateBackoffDelay(this.reconnectAttempts);
          this.logger.debug(`Waiting ${delay}ms before reconnecting...`);

          await new Promise(resolve => {
            this.reconnectTimeout = setTimeout(resolve, delay);
          });
        }
      }
    } catch (err) {
      this.emit('error', err);
    }
  }

  /**
   * connect establishes the WebSocket connection
   */
  private connect(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.debug(`Connecting to WebSocket: ${this.url.toString()}`);

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
        resolve(ws);
      });

      ws.on('error', (error: Error) => {
        clearTimeout(timeout);
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
      this.handleClose(code);
    });

    ws.on('error', (error: Error) => {
      this.handleError(error);
    });
  }

  /**
   * handleMessage processes incoming WebSocket messages
   */
  private async handleMessage(data: any): Promise<void> {
    try {
      
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
        this.emit('error', new Error(`Failed to parse datastream message: ${err}`));
        return;
      }


      // Handle the parsed message using the provided handler
      try {
        await this.messageHandler(this.ctx, message);
      } catch (err) {
        this.emit('error', new Error(`Message handler error: ${err}`));
      }
    } catch (err) {
      this.emit('error', err);
    }
  }

  /**
   * handleClose processes WebSocket close events
   */
  private handleClose(code: number): void {
    this.logger.info(`WebSocket connection closed with code ${code}`);
    this.setConnected(false);
    this.setReady(false);
    this.cleanup();
  }

  /**
   * handleError processes WebSocket error events
   */
  private handleError(error: Error): void {
    this.logger.error(`WebSocket error: ${error.message}`);
    this.setConnected(false);
    this.setReady(false);
    this.cleanup();
  }

  /**
   * startPingPong initiates the ping/pong keepalive mechanism
   */
  private startPingPong(): void {
    this.logger.debug('Starting ping/pong keepalive mechanism');
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, PING_PERIOD);
  }

  /**
   * sendPing sends a ping message to keep the connection alive
   */
  private sendPing(): void {
    if (!this.ws) {
      return;
    }

    
    // Set pong timeout
    this.pongTimeout = setTimeout(() => {
      this.logger.warn('Pong timeout - closing connection');
      this.setConnected(false);
      if (this.ws) {
        this.ws.close();
      }
    }, PONG_WAIT);

    try {
      this.ws.ping();
    } catch (err) {
      this.logger.error(`Failed to send ping: ${err}`);
      this.setConnected(false);
    }
  }

  /**
   * handlePong handles pong responses from the server
   */
  private handlePong(): void {
    this.logger.debug('Received pong from server');
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
      this.logger.debug(`Connection state changed: ${connected}`);
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
      this.logger.debug(`Ready state changed: ${ready}`);
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
}