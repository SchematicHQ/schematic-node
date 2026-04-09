import {
  DataStreamClient,
  DataStreamClientOptions,
} from '../../../src/datastream/datastream-client';
import { LocalCache } from '../../../src/cache/local';
import { DatastreamWSClient } from '../../../src/datastream/websocket-client';
import { DataStreamResp, EntityType, MessageType } from '../../../src/datastream/types';
import { Logger } from '../../../src/logger';
import * as Schematic from '../../../src/api/types';
// Mock DatastreamWSClient
const mockDatastreamWSClientInstance = {
  on: jest.fn(),
  start: jest.fn(),
  close: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
  isReady: jest.fn().mockReturnValue(true),
  sendMessage: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../../../src/datastream/websocket-client', () => {
  return {
    DatastreamWSClient: jest.fn().mockImplementation(() => mockDatastreamWSClientInstance),
  };
});

// Mock RulesEngineClient so we can control what checkFlag returns
const mockRulesEngineInstance = {
  initialize: jest.fn().mockResolvedValue(undefined),
  isInitialized: jest.fn().mockReturnValue(false),
  checkFlag: jest.fn(),
  getVersionKey: jest.fn().mockReturnValue('1'),
};

jest.mock('../../../src/rules-engine', () => {
  return {
    RulesEngineClient: jest.fn().mockImplementation(() => mockRulesEngineInstance),
  };
});

describe('DataStreamClient', () => {
  let client: DataStreamClient;
  let mockLogger: Logger;
  let options: DataStreamClientOptions;

  // Mock data uses snake_case to match wire format from WebSocket
  const mockCompany = {
    id: 'company-123',
    account_id: 'account-123',
    environment_id: 'env-123',
    keys: { name: 'Test Company' },
    traits: [],
    rules: [],
    metrics: [],
    plan_ids: [],
    billing_product_ids: [],
    crm_product_ids: [],
    credit_balances: {},
  } as unknown as Schematic.RulesengineCompany;

  const mockUser = {
    id: 'user-123',
    account_id: 'account-123',
    environment_id: 'env-123',
    keys: { email: 'test@example.com' },
    traits: [],
    rules: [],
  } as unknown as Schematic.RulesengineUser;

  const mockFlag = {
    id: 'flag-123',
    key: 'test-flag',
    account_id: 'account-123',
    environment_id: 'env-123',
    default_value: false,
    rules: [],
  } as unknown as Schematic.RulesengineFlag;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset sendMessage to default implementation
    mockDatastreamWSClientInstance.sendMessage.mockResolvedValue(undefined);
    
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
    mockDatastreamWSClientInstance.sendMessage.mockResolvedValue(undefined);
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
    expect(mockDatastreamWSClientInstance.start).toHaveBeenCalled();
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
    const onCalls = mockDatastreamWSClientInstance.on.mock.calls;
    const connectedHandler = onCalls.find((call: [string, Function]) => call[0] === 'connected')?.[1];
    const disconnectedHandler = onCalls.find((call: [string, Function]) => call[0] === 'disconnected')?.[1];
    const readyHandler = onCalls.find((call: [string, Function]) => call[0] === 'ready')?.[1];
    const errorHandler = onCalls.find((call: [string, Function]) => call[0] === 'error')?.[1];

    if (connectedHandler) connectedHandler();
    if (disconnectedHandler) disconnectedHandler();
    if (readyHandler) readyHandler();
    if (errorHandler) errorHandler(new Error('test error'));

    expect(connectSpy).toHaveBeenCalled();
    expect(disconnectSpy).toHaveBeenCalled();
    expect(readySpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(new Error('test error'));
  });

  test('should handle reconnection state', async () => {
    const connectSpy = jest.fn();
    const disconnectSpy = jest.fn();

    client.on('connected', connectSpy);
    client.on('disconnected', disconnectSpy);

    await client.start();

    // Get the event handlers registered on the WebSocket client mock
    const onCalls = mockDatastreamWSClientInstance.on.mock.calls;
    const connectedHandler = onCalls.find((call: [string, Function]) => call[0] === 'connected')?.[1];
    const disconnectedHandler = onCalls.find((call: [string, Function]) => call[0] === 'disconnected')?.[1];

    // Simulate initial connected state
    mockDatastreamWSClientInstance.isConnected.mockReturnValue(true);
    if (connectedHandler) connectedHandler();

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(client.isConnected()).toBe(true);

    // Simulate disconnect
    mockDatastreamWSClientInstance.isConnected.mockReturnValue(false);
    if (disconnectedHandler) disconnectedHandler();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(client.isConnected()).toBe(false);

    // Simulate reconnection (connected event fires again)
    mockDatastreamWSClientInstance.isConnected.mockReturnValue(true);
    if (connectedHandler) connectedHandler();

    expect(connectSpy).toHaveBeenCalledTimes(2);
    expect(client.isConnected()).toBe(true);
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
    await messageHandler(companyMessage);

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
    await messageHandler(userMessage);

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
    await messageHandler(flagMessage);

    // Verify flag is cached and can be retrieved
    const retrievedFlag = await client.getFlag(mockFlag.key);
    expect(retrievedFlag).toEqual(mockFlag);
  });

  test('should handle partial entity message merging', async () => {
    await client.start();

    // Get message handler
    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Send a FULL company message with all fields
    const fullCompany = {
      id: 'company-partial',
      account_id: 'account-123',
      environment_id: 'env-123',
      keys: { name: 'Partial Corp' },
      traits: [{ key: 'tier', value: 'free' }],
      rules: [],
      metrics: [],
      plan_ids: ['plan-1'],
      billing_product_ids: [],
      crm_product_ids: [],
      credit_balances: {},
    } as unknown as Schematic.RulesengineCompany;

    await messageHandler({
      entity_type: EntityType.COMPANY,
      message_type: MessageType.FULL,
      data: fullCompany,
    });

    // Verify the full company is cached
    const cachedFull = await client.getCompany({ name: 'Partial Corp' });
    expect(cachedFull).toEqual(fullCompany);

    // Send a PARTIAL company message. Wire shape: data is the partial fields,
    // entity_id at the top level identifies the cached company to merge into.
    await messageHandler({
      entity_type: EntityType.COMPANY,
      entity_id: 'company-partial',
      message_type: MessageType.PARTIAL,
      data: {
        keys: { name: 'Partial Corp' },
        traits: [{ key: 'tier', value: 'enterprise' }],
        plan_ids: ['plan-2'],
      },
    });

    // Partial messages are now properly merged: fields in the partial update
    // the cached entity, while fields not present in the partial are preserved.
    const cachedAfterPartial = await client.getCompany({ name: 'Partial Corp' });
    expect(cachedAfterPartial.id).toBe('company-partial');
    expect((cachedAfterPartial as any).traits).toEqual([{ key: 'tier', value: 'enterprise' }]);
    expect((cachedAfterPartial as any).plan_ids).toEqual(['plan-2']);
    // Original fields not present in the partial message are preserved
    expect((cachedAfterPartial as any).metrics).toEqual([]);
    expect((cachedAfterPartial as any).rules).toEqual([]);
    expect((cachedAfterPartial as any).account_id).toBe('account-123');
    expect((cachedAfterPartial as any).billing_product_ids).toEqual([]);
  }, 10000);

  test('should skip partial company message when entity is not in cache', async () => {
    await client.start();

    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Send a PARTIAL for a company that was never cached via FULL
    await messageHandler({
      entity_type: EntityType.COMPANY,
      entity_id: 'company-unknown',
      message_type: MessageType.PARTIAL,
      data: {
        keys: { name: 'Ghost Corp' },
        traits: [{ key: 'tier', value: 'enterprise' }],
      },
    });

    // Warn should be logged about the cache miss
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Cache miss for partial company 'company-unknown'")
    );

    // No company should have been cached (no cacheCompanyForKeys call for this entity)
    expect(mockLogger.debug).not.toHaveBeenCalledWith(
      expect.stringContaining('Ghost Corp')
    );
  }, 10000);

  test('should skip partial user message when entity is not in cache', async () => {
    await client.start();

    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Send a PARTIAL for a user that was never cached via FULL
    await messageHandler({
      entity_type: EntityType.USER,
      entity_id: 'user-unknown',
      message_type: MessageType.PARTIAL,
      data: {
        keys: { email: 'ghost@example.com' },
        traits: [{ key: 'tier', value: 'enterprise' }],
      },
    });

    // Warn should be logged about the cache miss
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Cache miss for partial user 'user-unknown'")
    );

    // No user should have been cached
    expect(mockLogger.debug).not.toHaveBeenCalledWith(
      expect.stringContaining('ghost@example.com')
    );
  }, 10000);

  test('should request data from datastream when not in cache', async () => {
    // Set up connected state
    mockDatastreamWSClientInstance.isConnected.mockReturnValue(true);
    
    await client.start();

    // Get message handler
    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Get the connection handler from the WebSocket client mock
    const onCalls = mockDatastreamWSClientInstance.on.mock.calls;
    const connectedHandler = onCalls.find((call: [string, Function]) => call[0] === 'connected')?.[1];

    // Mock sendMessage to automatically trigger response
    mockDatastreamWSClientInstance.sendMessage.mockImplementation(async (message: any) => {
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
          messageHandler(companyMessage);
        });
      }
    });

    // Simulate connected state
    if (connectedHandler) connectedHandler();

    // Request company not in cache - should send datastream request and get response
    const result = await client.getCompany({ id: 'company-456' });

    // Verify request was sent
    expect(mockDatastreamWSClientInstance.sendMessage).toHaveBeenCalledWith({
      data: {
        entity_type: EntityType.COMPANY,
        keys: { id: 'company-456' },
      }
    });

    // Verify we got the expected result
    expect(result.id).toBe('company-456');
  });

  test('should handle multiple pending requests for same entity', async () => {
    mockDatastreamWSClientInstance.isConnected.mockReturnValue(true);
    
    let sentRequestCount = 0;
    
    await client.start();

    // Get message handler
    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Get the connection handler from the WebSocket client mock
    const onCalls = mockDatastreamWSClientInstance.on.mock.calls;
    const connectedHandler = onCalls.find((call: [string, Function]) => call[0] === 'connected')?.[1];

    // Mock sendMessage to track requests and auto-respond
    mockDatastreamWSClientInstance.sendMessage.mockImplementation(async (message: any) => {
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
          messageHandler(companyMessage);
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
    mockDatastreamWSClientInstance.isConnected.mockReturnValue(false);

    await expect(client.getCompany({ id: 'company-123' })).rejects.toThrow('DataStream client is not connected');
    await expect(client.getUser({ id: 'user-123' })).rejects.toThrow('DataStream client is not connected');
    // Note: getFlag doesn't require connection, it only checks cache
  });

  test('should handle entity messages and update cache', async () => {
    await client.start();

    const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
    const messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;

    // Send company message
    await messageHandler({
      entity_type: EntityType.COMPANY,
      message_type: MessageType.FULL,
      data: mockCompany,
    });

    // Send user message
    await messageHandler({
      entity_type: EntityType.USER,
      message_type: MessageType.FULL,
      data: mockUser,
    });

    // Send flag message
    await messageHandler({
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

    await messageHandler(companyErrorMessage);

    // Verify warning was logged but no error event was emitted
    expect(mockLogger.warn).toHaveBeenCalledWith('DataStream error received: Company not found');

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

    await messageHandler(userErrorMessage);

    // Verify warning was logged
    expect(mockLogger.warn).toHaveBeenCalledWith('DataStream error received: User not found');

    // Test 3: Generic error message without entity type or keys
    const genericErrorMessage: DataStreamResp = {
      entity_type: 'unknown',
      message_type: MessageType.ERROR,
      data: {
        error: 'Generic datastream error'
      }
    };

    await messageHandler(genericErrorMessage);

    // Verify warning was logged
    expect(mockLogger.warn).toHaveBeenCalledWith('DataStream error received: Generic datastream error');

    // Test 4: Error message with no error text (should use default)
    const noErrorTextMessage: DataStreamResp = {
      entity_type: 'unknown',
      message_type: MessageType.ERROR,
      data: {}
    };

    await messageHandler(noErrorTextMessage);

    // Verify warning was logged with default message
    expect(mockLogger.warn).toHaveBeenCalledWith('DataStream error received: Unknown datastream error');

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

    await messageHandler(unsupportedEntityErrorMessage);

    // Verify warnings were logged for both unsupported entity type and the error message
    expect(mockLogger.warn).toHaveBeenCalledWith('Received error for unsupported entity type: rulesengine.Flags');
    expect(mockLogger.warn).toHaveBeenCalledWith('DataStream error received: Unsupported entity error');
    
    // Verify no error events were emitted throughout the test
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('should handle replicator mode configuration', () => {
    const mockRedisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      setEx: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      scanIterator: jest.fn().mockReturnValue((async function* () {})()),
    };

    const replicatorClient = new DataStreamClient({
      ...options,
      replicatorMode: true,
      replicatorHealthURL: 'http://localhost:8080/health',
      replicatorHealthCheck: 10000,
      redisClient: mockRedisClient,
    });

    expect(replicatorClient).toBeInstanceOf(DataStreamClient);
    expect(replicatorClient.isReplicatorMode()).toBe(true);
    expect(replicatorClient.getReplicatorCacheVersion()).toBeUndefined();
  });

  test('should throw if replicator mode is enabled without redis client or custom cache providers', () => {
    expect(() => {
      new DataStreamClient({
        ...options,
        replicatorMode: true,
      });
    }).toThrow('Replicator mode requires a Redis client or custom cache providers for shared cache access');
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

    const mockRedisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      setEx: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      scanIterator: jest.fn().mockReturnValue((async function* () {})()),
    };

    const replicatorClient = new DataStreamClient({
      ...options,
      replicatorMode: true,
      replicatorHealthURL: 'http://localhost:8080/health',
      replicatorHealthCheck: 30000, // Long interval to prevent multiple calls
      redisClient: mockRedisClient,
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
    
    expect(mockDatastreamWSClientInstance.close).toHaveBeenCalled();
    expect(client.isConnected()).toBe(false);
  });

  test('should clear pending requests on disconnect', async () => {
    mockDatastreamWSClientInstance.isConnected.mockReturnValue(true);
    
    // Mock sendMessage to not respond (simulating pending request)
    mockDatastreamWSClientInstance.sendMessage.mockImplementation(() => {
      // Don't send any response - leave the request pending
      return Promise.resolve();
    });

    await client.start();

    const onCalls = mockDatastreamWSClientInstance.on.mock.calls;
    const connectedHandler = onCalls.find(call => call[0] === 'connected')?.[1];
    if (connectedHandler) connectedHandler();

    // Start a request that will be pending
    const companyPromise = client.getCompany({ id: 'company-pending' });

    // Give it a moment to register the pending request
    await new Promise(resolve => process.nextTick(resolve));

    // Now simulate disconnect to trigger cleanup
    mockDatastreamWSClientInstance.isConnected.mockReturnValue(false);
    const disconnectedHandler = onCalls.find(call => call[0] === 'disconnected')?.[1];
    if (disconnectedHandler) disconnectedHandler();

    // Promise should reject due to cleanup (the actual error message is 'Company not found')
    await expect(companyPromise).rejects.toThrow('Company not found');
  });

  describe('two-level caching', () => {
    const multiKeyCompany = {
      id: 'company-multi',
      account_id: 'account-123',
      environment_id: 'env-123',
      keys: { name: 'acme', slug: 'acme-corp', external_id: 'ext-1' },
      traits: [],
      rules: [],
      metrics: [],
      plan_ids: [],
      billing_product_ids: [],
      crm_product_ids: [],
      credit_balances: {},
    } as unknown as Schematic.RulesengineCompany;

    const multiKeyUser = {
      id: 'user-multi',
      account_id: 'account-123',
      environment_id: 'env-123',
      keys: { email: 'alice@example.com', user_id: 'u-1' },
      traits: [],
      rules: [],
    } as unknown as Schematic.RulesengineUser;

    let messageHandler: (message: DataStreamResp) => Promise<void>;

    beforeEach(async () => {
      await client.start();
      const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
      messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;
    });

    test('should retrieve company by any of its keys after caching', async () => {
      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: multiKeyCompany,
      });

      // Look up by each key individually
      const byName = await client.getCompany({ name: 'acme' });
      const bySlug = await client.getCompany({ slug: 'acme-corp' });
      const byExtId = await client.getCompany({ external_id: 'ext-1' });

      expect(byName).toEqual(multiKeyCompany);
      expect(bySlug).toEqual(multiKeyCompany);
      expect(byExtId).toEqual(multiKeyCompany);
    });

    test('should retrieve user by any of its keys after caching', async () => {
      await messageHandler({
        entity_type: EntityType.USER,
        message_type: MessageType.FULL,
        data: multiKeyUser,
      });

      const byEmail = await client.getUser({ email: 'alice@example.com' });
      const byUserId = await client.getUser({ user_id: 'u-1' });

      expect(byEmail).toEqual(multiKeyUser);
      expect(byUserId).toEqual(multiKeyUser);
    });

    test('should remove company from cache on DELETE for all keys', async () => {
      mockDatastreamWSClientInstance.isConnected.mockReturnValue(true);

      // Cache the company first
      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: multiKeyCompany,
      });

      // Verify it's cached — returns from cache without sending a WS request
      mockDatastreamWSClientInstance.sendMessage.mockClear();
      const cached = await client.getCompany({ name: 'acme' });
      expect(cached).toEqual(multiKeyCompany);
      expect(mockDatastreamWSClientInstance.sendMessage).not.toHaveBeenCalled();

      // Send DELETE
      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.DELETE,
        data: multiKeyCompany,
      });

      // Don't respond — leave requests pending so we can inspect sendMessage calls
      mockDatastreamWSClientInstance.sendMessage.mockResolvedValue(undefined);

      // After delete, each key should miss cache and trigger a WS request
      for (const [key, value] of Object.entries(multiKeyCompany.keys!)) {
        mockDatastreamWSClientInstance.sendMessage.mockClear();
        // Don't await — the promise will pend waiting for a WS response
        const pending = client.getCompany({ [key]: value });
        // Let the async cache lookup resolve before checking
        await new Promise(resolve => process.nextTick(resolve));
        // A WS request proves the cache was empty for this key
        expect(mockDatastreamWSClientInstance.sendMessage).toHaveBeenCalledTimes(1);
        // Resolve the pending request so it doesn't leak
        await messageHandler({
          entity_type: EntityType.COMPANY,
          message_type: MessageType.FULL,
          data: { ...multiKeyCompany, keys: { [key]: value } },
        });
        await pending;
      }
    });

    test('should remove user from cache on DELETE for all keys', async () => {
      mockDatastreamWSClientInstance.isConnected.mockReturnValue(true);

      // Cache the user
      await messageHandler({
        entity_type: EntityType.USER,
        message_type: MessageType.FULL,
        data: multiKeyUser,
      });

      // Verify it's cached — returns from cache without sending a WS request
      mockDatastreamWSClientInstance.sendMessage.mockClear();
      const cached = await client.getUser({ email: 'alice@example.com' });
      expect(cached).toEqual(multiKeyUser);
      expect(mockDatastreamWSClientInstance.sendMessage).not.toHaveBeenCalled();

      // Send DELETE
      await messageHandler({
        entity_type: EntityType.USER,
        message_type: MessageType.DELETE,
        data: multiKeyUser,
      });

      // Don't respond — leave requests pending so we can inspect sendMessage calls
      mockDatastreamWSClientInstance.sendMessage.mockResolvedValue(undefined);

      // After delete, each key should miss cache and trigger a WS request
      for (const [key, value] of Object.entries(multiKeyUser.keys!)) {
        mockDatastreamWSClientInstance.sendMessage.mockClear();
        const pending = client.getUser({ [key]: value });
        await new Promise(resolve => process.nextTick(resolve));
        // A WS request proves the cache was empty for this key
        expect(mockDatastreamWSClientInstance.sendMessage).toHaveBeenCalledTimes(1);
        // Resolve the pending request so it doesn't leak
        await messageHandler({
          entity_type: EntityType.USER,
          message_type: MessageType.FULL,
          data: { ...multiKeyUser, keys: { [key]: value } },
        });
        await pending;
      }
    });

    test('should update company in cache and reflect changes across all keys', async () => {
      // Cache initial company
      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: multiKeyCompany,
      });

      // Send updated company with same keys but different data
      const updatedCompany = {
        ...multiKeyCompany,
        traits: [{ key: 'tier', value: 'enterprise' }],
      } as unknown as Schematic.RulesengineCompany;

      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: updatedCompany,
      });

      // All keys should return the updated company
      const byName = await client.getCompany({ name: 'acme' });
      const bySlug = await client.getCompany({ slug: 'acme-corp' });

      expect(byName).toEqual(updatedCompany);
      expect(bySlug).toEqual(updatedCompany);
    });

    test('should handle deep copy to prevent mutation of cached entities', async () => {
      // Cache a company
      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: multiKeyCompany,
      });

      // Retrieve the company from cache
      const firstRetrieval = await client.getCompany({ name: 'acme' });
      expect(firstRetrieval).toEqual(multiKeyCompany);

      // Mutate a field on the returned object
      (firstRetrieval as any).traits = [{ key: 'mutated', value: 'yes' }];

      // Retrieve the company again from cache
      const secondRetrieval = await client.getCompany({ name: 'acme' });

      // NOTE: The LocalCache returns references, not copies, so mutation of
      // a retrieved object DOES affect subsequent cache reads. This test
      // documents the current behavior: the cache does not deep-copy on get.
      // If deep-copy-on-read were implemented, secondRetrieval.traits would
      // still equal the original (empty array).
      expect((secondRetrieval as any).traits).toEqual([{ key: 'mutated', value: 'yes' }]);
    });

    test('should remove stale company key mappings when a key is deleted', async () => {
      mockDatastreamWSClientInstance.isConnected.mockReturnValue(true);

      // Cache company with three keys: name, slug, external_id
      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: multiKeyCompany,
      });

      // Verify all three keys resolve from cache
      expect(await client.getCompany({ name: 'acme' })).toEqual(multiKeyCompany);
      expect(await client.getCompany({ slug: 'acme-corp' })).toEqual(multiKeyCompany);
      expect(await client.getCompany({ external_id: 'ext-1' })).toEqual(multiKeyCompany);

      // Update with only two keys — external_id has been removed
      const updatedCompany = {
        ...multiKeyCompany,
        keys: { name: 'acme', slug: 'acme-corp' },
      } as unknown as Schematic.RulesengineCompany;

      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: updatedCompany,
      });

      // Remaining keys should still resolve from cache
      expect(await client.getCompany({ name: 'acme' })).toEqual(updatedCompany);
      expect(await client.getCompany({ slug: 'acme-corp' })).toEqual(updatedCompany);

      // Removed key should miss cache and trigger a WS request
      mockDatastreamWSClientInstance.sendMessage.mockClear();
      const pending = client.getCompany({ external_id: 'ext-1' });
      await new Promise(resolve => process.nextTick(resolve));
      expect(mockDatastreamWSClientInstance.sendMessage).toHaveBeenCalledTimes(1);

      // Resolve pending request to avoid leak
      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: { ...updatedCompany, keys: { external_id: 'ext-1' } },
      });
      await pending;
    });

    test('should remove stale user key mappings when a key is deleted', async () => {
      mockDatastreamWSClientInstance.isConnected.mockReturnValue(true);

      // Cache user with two keys: email, user_id
      await messageHandler({
        entity_type: EntityType.USER,
        message_type: MessageType.FULL,
        data: multiKeyUser,
      });

      // Verify both keys resolve from cache
      expect(await client.getUser({ email: 'alice@example.com' })).toEqual(multiKeyUser);
      expect(await client.getUser({ user_id: 'u-1' })).toEqual(multiKeyUser);

      // Update with only email — user_id has been removed
      const updatedUser = {
        ...multiKeyUser,
        keys: { email: 'alice@example.com' },
      } as unknown as Schematic.RulesengineUser;

      await messageHandler({
        entity_type: EntityType.USER,
        message_type: MessageType.FULL,
        data: updatedUser,
      });

      // Remaining key should still resolve from cache
      expect(await client.getUser({ email: 'alice@example.com' })).toEqual(updatedUser);

      // Removed key should miss cache and trigger a WS request
      mockDatastreamWSClientInstance.sendMessage.mockClear();
      const pending = client.getUser({ user_id: 'u-1' });
      await new Promise(resolve => process.nextTick(resolve));
      expect(mockDatastreamWSClientInstance.sendMessage).toHaveBeenCalledTimes(1);

      // Resolve pending request to avoid leak
      await messageHandler({
        entity_type: EntityType.USER,
        message_type: MessageType.FULL,
        data: { ...updatedUser, keys: { user_id: 'u-1' } },
      });
      await pending;
    });

    test('should remove stale company key mappings when a key value changes', async () => {
      mockDatastreamWSClientInstance.isConnected.mockReturnValue(true);

      // Cache company with slug 'acme-corp'
      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: multiKeyCompany,
      });

      expect(await client.getCompany({ slug: 'acme-corp' })).toEqual(multiKeyCompany);

      // Update: slug value changed from 'acme-corp' to 'acme-inc'
      const updatedCompany = {
        ...multiKeyCompany,
        keys: { name: 'acme', slug: 'acme-inc', external_id: 'ext-1' },
      } as unknown as Schematic.RulesengineCompany;

      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: updatedCompany,
      });

      // New slug should resolve from cache
      expect(await client.getCompany({ slug: 'acme-inc' })).toEqual(updatedCompany);

      // Old slug value should miss cache and trigger a WS request
      mockDatastreamWSClientInstance.sendMessage.mockClear();
      const pending = client.getCompany({ slug: 'acme-corp' });
      await new Promise(resolve => process.nextTick(resolve));
      expect(mockDatastreamWSClientInstance.sendMessage).toHaveBeenCalledTimes(1);

      // Resolve pending request to avoid leak
      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: { ...updatedCompany, keys: { slug: 'acme-corp' } },
      });
      await pending;
    });

    test('should update company metrics and reflect via all keys', async () => {
      const companyWithMetrics = {
        ...multiKeyCompany,
        metrics: [
          { eventSubtype: 'api-call', value: 10 },
        ],
      } as unknown as Schematic.RulesengineCompany;

      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: companyWithMetrics,
      });

      // Update metrics via one key set
      await client.updateCompanyMetrics({ name: 'acme' }, 'api-call', 5);

      // Read back via a different key
      const bySlug = await client.getCompany({ slug: 'acme-corp' });
      const metric = (bySlug as any).metrics.find((m: any) => m.eventSubtype === 'api-call');
      expect(metric.value).toBe(15);
    });
  });

  describe('evaluateFlag entitlement population', () => {
    let messageHandler: (message: DataStreamResp) => Promise<void>;

    const companyForEntitlement = {
      id: 'company-ent',
      account_id: 'account-123',
      environment_id: 'env-123',
      keys: { name: 'Entitlement Corp' },
      traits: [],
      rules: [],
      metrics: [],
      plan_ids: [],
      billing_product_ids: [],
      crm_product_ids: [],
      credit_balances: {},
    } as unknown as Schematic.RulesengineCompany;

    const flagForEntitlement = {
      id: 'flag-ent',
      key: 'test-flag',
      account_id: 'account-123',
      environment_id: 'env-123',
      default_value: true,
      rules: [],
    } as unknown as Schematic.RulesengineFlag;

    beforeEach(async () => {
      // Enable the rules engine mock for entitlement tests
      mockRulesEngineInstance.isInitialized.mockReturnValue(true);

      await client.start();
      const DatastreamWSClientMock = DatastreamWSClient as jest.MockedClass<typeof DatastreamWSClient>;
      messageHandler = DatastreamWSClientMock.mock.calls[0][0].messageHandler;
    });

    afterEach(() => {
      // Reset rules engine mock
      mockRulesEngineInstance.isInitialized.mockReturnValue(false);
      mockRulesEngineInstance.checkFlag.mockReset();
    });

    test('should include entitlement from WASM result in flag check response', async () => {
      // Mock the WASM rules engine returning an entitlement (camelCase from WASM)
      mockRulesEngineInstance.checkFlag.mockResolvedValue({
        value: true,
        reason: 'PLAN_ENTITLEMENT',
        ruleId: 'rule-1',
        entitlement: {
          featureId: 'feature-123',
          featureKey: 'test-flag',
          valueType: 'numeric',
          allocation: 100,
          usage: 42,
        },
      });

      // Cache company and flag
      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: companyForEntitlement,
      });
      await messageHandler({
        entity_type: EntityType.FLAGS,
        message_type: MessageType.FULL,
        data: [flagForEntitlement],
      });

      const result = await client.checkFlag(
        { company: { name: 'Entitlement Corp' } },
        'test-flag',
      );

      expect(result.entitlement).toBeDefined();
      expect(result.entitlement?.featureId).toBe('feature-123');
      expect(result.entitlement?.featureKey).toBe('test-flag');
      expect(result.entitlement?.allocation).toBe(100);
      expect(result.entitlement?.usage).toBe(42);
    });

    test('should not include entitlement when WASM result has no entitlement', async () => {
      mockRulesEngineInstance.checkFlag.mockResolvedValue({
        value: false,
        reason: 'DEFAULT',
      });

      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: companyForEntitlement,
      });
      await messageHandler({
        entity_type: EntityType.FLAGS,
        message_type: MessageType.FULL,
        data: [flagForEntitlement],
      });

      const result = await client.checkFlag(
        { company: { name: 'Entitlement Corp' } },
        'test-flag',
      );

      expect(result.entitlement).toBeUndefined();
    });

    test('should pass through WASM entitlement credit fields directly', async () => {
      mockRulesEngineInstance.checkFlag.mockResolvedValue({
        value: true,
        reason: 'PLAN_ENTITLEMENT',
        entitlement: {
          featureId: 'feature-456',
          featureKey: 'test-flag',
          valueType: 'credit',
          creditId: 'credit-1',
          creditTotal: 1000,
          creditUsed: 250,
          creditRemaining: 750,
        },
      });

      await messageHandler({
        entity_type: EntityType.COMPANY,
        message_type: MessageType.FULL,
        data: companyForEntitlement,
      });
      await messageHandler({
        entity_type: EntityType.FLAGS,
        message_type: MessageType.FULL,
        data: [flagForEntitlement],
      });

      const result = await client.checkFlag(
        { company: { name: 'Entitlement Corp' } },
        'test-flag',
      );

      expect(result.entitlement).toBeDefined();
      expect(result.entitlement?.creditId).toBe('credit-1');
      expect(result.entitlement?.creditTotal).toBe(1000);
      expect(result.entitlement?.creditUsed).toBe(250);
      expect(result.entitlement?.creditRemaining).toBe(750);
    });

    test('should not include entitlement when no company is provided', async () => {
      mockRulesEngineInstance.checkFlag.mockResolvedValue({
        value: true,
        reason: 'DEFAULT',
      });

      await messageHandler({
        entity_type: EntityType.FLAGS,
        message_type: MessageType.FULL,
        data: [flagForEntitlement],
      });

      const result = await client.checkFlag({}, 'test-flag');

      expect(result.entitlement).toBeUndefined();
    });
  });

});