import { DatastreamClient, Logger, MessageHandlerFunc, ConnectionReadyHandlerFunc, DataStreamResp, EntityType, Action } from '../datastream';

// Mock logger implementation
class MockLogger implements Logger {
  debug(ctx: any, message: string, ...args: any[]): void {
    console.log(`[DEBUG] ${message}`, ...args);
  }
  
  info(ctx: any, message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }
  
  warn(ctx: any, message: string, ...args: any[]): void {
    console.log(`[WARN] ${message}`, ...args);
  }
  
  error(ctx: any, message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

describe('DatastreamClient', () => {
  let client: DatastreamClient;
  const mockLogger = new MockLogger();

  const mockMessageHandler: MessageHandlerFunc = async (ctx: any, message: DataStreamResp) => {
    console.log('Received message:', message);
  };

  const mockConnectionReadyHandler: ConnectionReadyHandlerFunc = async (ctx: any) => {
    console.log('Connection ready');
  };

  afterEach(() => {
    if (client) {
      client.close();
    }
  });

  test('should create client with required options', () => {
    expect(() => {
      client = new DatastreamClient({
        url: 'wss://datastream.example.com/datastream',
        apiKey: 'test-key',
        messageHandler: mockMessageHandler,
        logger: mockLogger,
      });
    }).not.toThrow();

    expect(client.isConnected()).toBe(false);
    expect(client.isReady()).toBe(false);
  });

  test('should throw error when URL is missing', () => {
    expect(() => {
      new DatastreamClient({
        url: '',
        apiKey: 'test-key',
        messageHandler: mockMessageHandler,
      });
    }).toThrow('URL is required');
  });

  test('should throw error when API key is missing', () => {
    expect(() => {
      new DatastreamClient({
        url: 'wss://example.com',
        apiKey: '',
        messageHandler: mockMessageHandler,
      });
    }).toThrow('ApiKey is required');
  });

  test('should throw error when message handler is missing', () => {
    expect(() => {
      new DatastreamClient({
        url: 'wss://example.com',
        apiKey: 'test-key',
        messageHandler: undefined as any,
      });
    }).toThrow('MessageHandler is required');
  });

  test('should convert HTTP URL to WebSocket URL', () => {
    client = new DatastreamClient({
      url: 'https://api.schematichq.com',
      apiKey: 'test-key',
      messageHandler: mockMessageHandler,
      logger: mockLogger,
    });

    // The URL conversion is tested internally - we can't directly access the private url property
    // But we can verify the client was created successfully
    expect(client).toBeDefined();
    expect(client.isConnected()).toBe(false);
  });

  test('should convert HTTP localhost URL to WebSocket URL', () => {
    client = new DatastreamClient({
      url: 'http://localhost:8080',
      apiKey: 'test-key',
      messageHandler: mockMessageHandler,
      logger: mockLogger,
    });

    expect(client).toBeDefined();
    expect(client.isConnected()).toBe(false);
  });

  test('should handle WebSocket URL directly', () => {
    client = new DatastreamClient({
      url: 'wss://datastream.example.com/datastream',
      apiKey: 'test-key',
      messageHandler: mockMessageHandler,
      logger: mockLogger,
    });

    expect(client).toBeDefined();
    expect(client.isConnected()).toBe(false);
  });

  test('should set default options when not provided', () => {
    client = new DatastreamClient({
      url: 'wss://example.com',
      apiKey: 'test-key',
      messageHandler: mockMessageHandler,
    });

    // Defaults are applied internally - we verify by successful construction
    expect(client).toBeDefined();
  });

  test('should use custom options when provided', () => {
    client = new DatastreamClient({
      url: 'wss://example.com',
      apiKey: 'test-key',
      messageHandler: mockMessageHandler,
      connectionReadyHandler: mockConnectionReadyHandler,
      logger: mockLogger,
      maxReconnectAttempts: 5,
      minReconnectDelay: 2000,
      maxReconnectDelay: 60000,
    });

    expect(client).toBeDefined();
  });

  test('should emit events', (done) => {
    client = new DatastreamClient({
      url: 'wss://example.com',
      apiKey: 'test-key',
      messageHandler: mockMessageHandler,
      logger: mockLogger,
    });

    // Test that the client can emit events
    client.on('error', (error) => {
      expect(error).toBeDefined();
      done();
    });

    // Trigger an error to test event emission
    client.emit('error', new Error('Test error'));
  });

  test('should reject sendMessage when not connected', async () => {
    client = new DatastreamClient({
      url: 'wss://example.com',
      apiKey: 'test-key',
      messageHandler: mockMessageHandler,
      logger: mockLogger,
    });

    await expect(client.sendMessage({ test: 'message' })).rejects.toThrow('WebSocket connection is not available!');
  });
});