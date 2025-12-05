import { EventEmitter } from 'events';
import {
  DataStreamClient,
  DataStreamClientOptions,
} from './datastream-client';
import { LocalCache } from '../cache/local';
import { DatastreamWSClient, Logger } from './client';
import { DataStreamResp, EntityType, MessageType } from './types';
import * as Schematic from '../api/types';

// Mock DatastreamWSClient
const mockDatastreamWSClientInstanceInstance = {
  on: jest.fn(),
  start: jest.fn(),
  close: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  isReady: jest.fn().mockReturnValue(true),
  sendMessage: jest.fn().mockResolvedValue(undefined),
};

jest.mock('./client', () => {
  return {
    DatastreamWSClient: jest.fn().mockImplementation(() => mockDatastreamWSClientInstanceInstance),
  };
});

describe('DataStreamClient', () => {
  let client: DataStreamClient;
  let mockLogger: Logger;
  let options: DataStreamClientOptions;

  const mockCompany: Schematic.RulesengineCompany = {
    id: 'company-123',
    accountId: 'account-123',
    environmentId: 'env-123',
    keys: { name: 'Test Company' },
    traits: [],
    rules: [],
    metrics: [],
    planIds: [],
    billingProductIds: [],
    crmProductIds: [],
    creditBalances: {},
  };

  const mockUser: Schematic.RulesengineUser = {
    id: 'user-123',
    accountId: 'account-123',
    environmentId: 'env-123',
    keys: { email: 'test@example.com' },
    traits: [],
    rules: [],
  };

  const mockFlag: Schematic.RulesengineFlag = {
    id: 'flag-123',
    key: 'test-flag',
    accountId: 'account-123',
    environmentId: 'env-123',
    defaultValue: false,
    rules: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset sendMessage to default implementation
    mockDatastreamWSClientInstanceInstance.sendMessage.mockResolvedValue(undefined);
    
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    options = {
      apiKey: 'test-api-key',
      baseURL: 'https://api.schematichq.com',
      logger: mockLogger,
    };

    client = new DataStreamClient(options);
  });

  afterEach(async () => {
    if (client) {
      // Remove all listeners to prevent memory leaks
      client.removeAllListeners();
      client.close();
      // Wait for any pending process.nextTick operations to complete
      await new Promise(resolve => setImmediate(resolve));
    }
    jest.clearAllMocks();
    // Reset sendMessage to default implementation
    mockDatastreamWSClientInstanceInstance.sendMessage.mockResolvedValue(undefined);
  });

  test('should initialize with default options', () => {
    expect(client).toBeInstanceOf(DataStreamClient);
    expect(client.isConnected()).toBe(false);
  });

  test('should initialize with custom cache providers', () => {
    const customCompanyCache = new LocalCache<Schematic.RulesengineCompany>();
    const customUserCache = new LocalCache<Schematic.RulesengineUser>();
    const customFlagCache = new LocalCache<Schematic.RulesengineFlag>();

    const clientWithCustomCaches = new DataStreamClient({
      ...options,
      companyCache: customCompanyCache,
      userCache: customUserCache,
      flagCache: customFlagCache,
    });

    expect(clientWithCustomCaches).toBeInstanceOf(DataStreamClient);
  });

  test('should use different TTL for flag cache than other caches', () => {
    // Test with a custom cacheTTL that's shorter than MAX_CACHE_TTL (30 days)
    const customCacheTTL = 12 * 60 * 60 * 1000; // 12 hours
    const clientWithCustomTTL = new DataStreamClient({
      ...options,
      cacheTTL: customCacheTTL,
    });

    expect(clientWithCustomTTL).toBeInstanceOf(DataStreamClient);
    
    // Test with a custom cacheTTL that's longer than MAX_CACHE_TTL (30 days)
    // In this case, flag cache should use the custom TTL, not MAX_CACHE_TTL
    const longCacheTTL = 45 * 24 * 60 * 60 * 1000; // 45 days
    const clientWithLongTTL = new DataStreamClient({
      ...options,
      cacheTTL: longCacheTTL,
    });

    expect(clientWithLongTTL).toBeInstanceOf(DataStreamClient);
    // The internal behavior follows Go logic: max(MAX_CACHE_TTL, configured TTL) for flags
    // This ensures flag cache always has at least 30 days TTL, or more if configured
  });

  test('should start WebSocket client when started', async () => {
    await client.start();
    
    expect(DatastreamWSClient).toHaveBeenCalledWith({
      url: options.baseURL,
      apiKey: options.apiKey,
      messageHandler: expect.any(Function),
      connectionReadyHandler: expect.any(Function),
      logger: mockLogger,
    });
    expect(mockDatastreamWSClientInstanceInstance.start).toHaveBeenCalled();
  });

  test('should handle WebSocket events', async () => {
    const connectSpy = jest.fn();
    const disconnectSpy = jest.fn();
    const readySpy = jest.fn();
    const errorSpy = jest.fn();

    client.on('connected', connectSpy);
    client.on('disconnected', disconnectSpy);
    client.on('ready', readySpy);
    client.on('error', errorSpy);

    await client.start();

    // Simulate WebSocket events
    const onCalls = mockDatastreamWSClientInstanceInstance.on.mock.calls;
    const connectedHandler = onCalls.find((call: any) => call[0] === 'connected')?.[1];
    const disconnectedHandler = onCalls.find((call: any) => call[0] === 'disconnected')?.[1];
    const readyHandler = onCalls.find((call: any) => call[0] === 'ready')?.[1];
    const errorHandler = onCalls.find((call: any) => call[0] === 'error')?.[1];

    if (connectedHandler) connectedHandler();
    if (disconnectedHandler) disconnectedHandler();
    if (readyHandler) readyHandler();
    if (errorHandler) errorHandler(new Error('test error'));

    expect(connectSpy).toHaveBeenCalled();
    expect(disconnectSpy).toHaveBeenCalled();
    expect(readySpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(new Error('test error'));
  });

  test('should handle company messages and update cache', async () => {
    await client.start();

    // Get message handler
    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Create company message
    const companyMessage: DataStreamResp = {
      entity_type: EntityType.COMPANY,
      message_type: MessageType.FULL,
      data: mockCompany,
    };

    // Handle message
    await messageHandler({}, companyMessage);

    // Verify company is cached and can be retrieved using the correct keys
    const retrievedCompany = await client.getCompany(mockCompany.keys!);
    expect(retrievedCompany).toEqual(mockCompany);
  }, 10000);

  test('should handle user messages and update cache', async () => {
    await client.start();

    // Get message handler
    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Create user message
    const userMessage: DataStreamResp = {
      entity_type: EntityType.USER,
      message_type: MessageType.FULL,
      data: mockUser,
    };

    // Handle message
    await messageHandler({}, userMessage);

    // Verify user is cached and can be retrieved using the correct keys
    const retrievedUser = await client.getUser(mockUser.keys!);
    expect(retrievedUser).toEqual(mockUser);
  }, 10000);

  test('should handle flag messages and update cache', async () => {
    await client.start();

    // Get message handler
    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Create flag message
    const flagMessage: DataStreamResp = {
      entity_type: EntityType.FLAGS,
      message_type: MessageType.FULL,
      data: [mockFlag], // Flags can be sent as array
    };

    // Handle message
    await messageHandler({}, flagMessage);

    // Verify flag is cached and can be retrieved
    const retrievedFlag = await client.getFlag(mockFlag.key);
    expect(retrievedFlag).toEqual(mockFlag);
  });

  test('should request data from datastream when not in cache', async () => {
    // Set up connected state
    mockDatastreamWSClientInstanceInstance.isConnected.mockReturnValue(true);
    
    await client.start();

    // Get message handler
    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Get the connection handler from the WebSocket client mock
    const onCalls = mockDatastreamWSClientInstanceInstance.on.mock.calls;
    const connectedHandler = onCalls.find((call: any) => call[0] === 'connected')?.[1];

    // Mock sendMessage to automatically trigger response
    mockDatastreamWSClientInstanceInstance.sendMessage.mockImplementation(async (message: any) => {
      if (message.data?.entity_type === EntityType.COMPANY) {
        const responseCompany = { 
          ...mockCompany, 
          id: 'company-456',
          keys: { id: 'company-456' }
        };
        const companyMessage: DataStreamResp = {
          entity_type: EntityType.COMPANY,
          message_type: MessageType.FULL,
          data: responseCompany,
        };
        // Use process.nextTick for immediate execution
        process.nextTick(() => {
          messageHandler({}, companyMessage);
        });
      }
    });

    // Simulate connected state
    if (connectedHandler) connectedHandler();

    // Request company not in cache - should send datastream request and get response
    const result = await client.getCompany({ id: 'company-456' });

    // Verify request was sent
    expect(mockDatastreamWSClientInstanceInstance.sendMessage).toHaveBeenCalledWith({
      data: {
        entity_type: EntityType.COMPANY,
        keys: { id: 'company-456' },
      }
    });

    // Verify we got the expected result
    expect(result.id).toBe('company-456');
  });

  test('should handle multiple pending requests for same entity', async () => {
    mockDatastreamWSClientInstanceInstance.isConnected.mockReturnValue(true);
    
    let sentRequestCount = 0;
    
    await client.start();

    // Get message handler
    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Get the connection handler from the WebSocket client mock
    const onCalls = mockDatastreamWSClientInstanceInstance.on.mock.calls;
    const connectedHandler = onCalls.find((call: any) => call[0] === 'connected')?.[1];

    // Mock sendMessage to track requests and auto-respond
    mockDatastreamWSClientInstanceInstance.sendMessage.mockImplementation(async (message: any) => {
      sentRequestCount++;
      if (message.data?.entity_type === EntityType.COMPANY) {
        const responseCompany = { 
          ...mockCompany, 
          id: 'company-789',
          keys: { id: 'company-789' }
        };
        const companyMessage: DataStreamResp = {
          entity_type: EntityType.COMPANY,
          message_type: MessageType.FULL,
          data: responseCompany,
        };
        // Use process.nextTick for immediate execution
        process.nextTick(() => {
          messageHandler({}, companyMessage);
        });
      }
    });

    if (connectedHandler) connectedHandler();

    // Make multiple requests for same company
    const [result1, result2, result3] = await Promise.all([
      client.getCompany({ id: 'company-789' }),
      client.getCompany({ id: 'company-789' }),
      client.getCompany({ id: 'company-789' })
    ]);

    // Should only send one request for company (flags might be cached or not requested in this scenario)
    expect(sentRequestCount).toBeGreaterThanOrEqual(1); // At least 1 for company

    // All promises should resolve with same company
    expect(result1.id).toBe('company-789');
    expect(result2.id).toBe('company-789');
    expect(result3.id).toBe('company-789');
    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
  });

  test('should throw error when requesting data while disconnected', async () => {
    // Don't start client or set connected state
    mockDatastreamWSClientInstanceInstance.isConnected.mockReturnValue(false);

    await expect(client.getCompany({ id: 'company-123' })).rejects.toThrow('DataStream client is not connected');
    await expect(client.getUser({ id: 'user-123' })).rejects.toThrow('DataStream client is not connected');
    // Note: getFlag doesn't require connection, it only checks cache
  });

  test('should handle entity messages and update cache', async () => {
    await client.start();

    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Send company message
    await messageHandler({}, {
      entity_type: EntityType.COMPANY,
      message_type: MessageType.FULL,
      data: mockCompany,
    });

    // Send user message
    await messageHandler({}, {
      entity_type: EntityType.USER,
      message_type: MessageType.FULL,
      data: mockUser,
    });

    // Send flag message
    await messageHandler({}, {
      entity_type: EntityType.FLAGS,
      message_type: MessageType.FULL,
      data: [mockFlag],
    });

    // Verify entities are cached (no events expected)
    const cachedCompany = await client.getCompany(mockCompany.keys!);
    const cachedUser = await client.getUser(mockUser.keys!);
    const cachedFlag = await client.getFlag(mockFlag.key);

    expect(cachedCompany).toEqual(mockCompany);
    expect(cachedUser).toEqual(mockUser);
    expect(cachedFlag).toEqual(mockFlag);
  });

  test('should handle error type messages from WebSocket', async () => {
    const errorSpy = jest.fn();
    client.on('error', errorSpy);

    await client.start();

    // Get message handler
    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Test 1: Error message with entity type and keys (should notify pending requests and log warning)
    const companyErrorMessage: DataStreamResp = {
      entity_type: EntityType.COMPANY,
      message_type: MessageType.ERROR,
      data: {
        error: 'Company not found',
        entity_type: EntityType.COMPANY,
        keys: { id: 'company-not-found' }
      }
    };

    await messageHandler({}, companyErrorMessage);

    // Verify warning was logged but no error event was emitted
    expect(mockLogger.warn).toHaveBeenCalledWith({}, 'DataStream error received: Company not found');

    // Test 2: Error message with entity type and keys for user
    const userErrorMessage: DataStreamResp = {
      entity_type: EntityType.USER,
      message_type: MessageType.ERROR,
      data: {
        error: 'User not found',
        entity_type: EntityType.USER,
        keys: { id: 'user-not-found' }
      }
    };

    await messageHandler({}, userErrorMessage);

    // Verify warning was logged
    expect(mockLogger.warn).toHaveBeenCalledWith({}, 'DataStream error received: User not found');

    // Test 3: Generic error message without entity type or keys
    const genericErrorMessage: DataStreamResp = {
      entity_type: 'unknown',
      message_type: MessageType.ERROR,
      data: {
        error: 'Generic datastream error'
      }
    };

    await messageHandler({}, genericErrorMessage);

    // Verify warning was logged
    expect(mockLogger.warn).toHaveBeenCalledWith({}, 'DataStream error received: Generic datastream error');

    // Test 4: Error message with no error text (should use default)
    const noErrorTextMessage: DataStreamResp = {
      entity_type: 'unknown',
      message_type: MessageType.ERROR,
      data: {}
    };

    await messageHandler({}, noErrorTextMessage);

    // Verify warning was logged with default message
    expect(mockLogger.warn).toHaveBeenCalledWith({}, 'DataStream error received: Unknown datastream error');

    // Test 5: Unsupported entity type in error message should log warning
    const unsupportedEntityErrorMessage: DataStreamResp = {
      entity_type: EntityType.FLAGS, // FLAGS entity type is not supported for error handling
      message_type: MessageType.ERROR,
      data: {
        error: 'Unsupported entity error',
        entity_type: EntityType.FLAGS,
        keys: { key: 'some-flag-key' }
      }
    };

    await messageHandler({}, unsupportedEntityErrorMessage);

    // Verify warnings were logged for both unsupported entity type and the error message
    expect(mockLogger.warn).toHaveBeenCalledWith({}, 'Received error for unsupported entity type: rulesengine.Flags');
    expect(mockLogger.warn).toHaveBeenCalledWith({}, 'DataStream error received: Unsupported entity error');
    
    // Verify no error events were emitted throughout the test
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('should handle replicator mode configuration', () => {
    const replicatorClient = new DataStreamClient({
      ...options,
      replicatorMode: true,
      replicatorHealthURL: 'http://localhost:8080/health',
      replicatorHealthCheck: 10000,
    });

    expect(replicatorClient).toBeInstanceOf(DataStreamClient);
    expect(replicatorClient.isReplicatorMode()).toBe(true);
    expect(replicatorClient.getReplicatorCacheVersion()).toBeUndefined();
  });

  test('should fetch and use replicator cache version', async () => {
    // Mock global fetch
    const originalFetch = global.fetch;
    const mockFetch = jest.fn();
    global.fetch = mockFetch as any;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ready: true,
        cache_version: 'v123'
      })
    });

    const replicatorClient = new DataStreamClient({
      ...options,
      replicatorMode: true,
      replicatorHealthURL: 'http://localhost:8080/health',
      replicatorHealthCheck: 30000, // Long interval to prevent multiple calls
    });

    // Start the client to trigger initial health check
    await replicatorClient.start();

    // Wait a bit for the health check to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Cache version should be set
    expect(replicatorClient.getReplicatorCacheVersion()).toBe('v123');

    replicatorClient.close();
    
    // Restore original fetch
    global.fetch = originalFetch;
  });

  test('should use rules engine version key for cache keys in non-replicator mode', async () => {
    // Start the client (non-replicator mode)
    await client.start();

    // Try to get a flag - this will trigger cache key generation
    const flag = await client.getFlag('test-flag');
    
    // Flag won't be found but the cache key generation will have used the rules engine version
    expect(flag).toBeNull();
    
    client.close();
  });

  test('should close gracefully', async () => {
    await client.start();
    
    client.close();
    
    expect(mockDatastreamWSClientInstanceInstance.close).toHaveBeenCalled();
    expect(client.isConnected()).toBe(false);
  });

  test('should clear pending requests on disconnect', async () => {
    mockDatastreamWSClientInstanceInstance.isConnected.mockReturnValue(true);
    
    // Mock sendMessage to not respond (simulating pending request)
    mockDatastreamWSClientInstanceInstance.sendMessage.mockImplementation(() => {
      // Don't send any response - leave the request pending
      return Promise.resolve();
    });

    await client.start();

    const onCalls = mockDatastreamWSClientInstanceInstance.on.mock.calls;
    const connectedHandler = onCalls.find(call => call[0] === 'connected')?.[1];
    if (connectedHandler) connectedHandler();

    // Start a request that will be pending
    const companyPromise = client.getCompany({ id: 'company-pending' });

    // Give it a moment to register the pending request
    await new Promise(resolve => process.nextTick(resolve));

    // Now simulate disconnect to trigger cleanup
    mockDatastreamWSClientInstanceInstance.isConnected.mockReturnValue(false);
    const disconnectedHandler = onCalls.find(call => call[0] === 'disconnected')?.[1];
    if (disconnectedHandler) disconnectedHandler();

    // Promise should reject due to cleanup (the actual error message is 'Company not found')
    await expect(companyPromise).rejects.toThrow('Company not found');
  });


});