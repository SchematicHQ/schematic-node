import { SchematicClient, CheckFlagWithEntitlementResponse } from '../../src/wrapper';
import * as api from '../../src/api';

// Mock the DataStreamClient module
jest.mock('../../src/datastream', () => {
  return {
    DataStreamClient: jest.fn().mockImplementation(() => ({
      start: jest.fn().mockResolvedValue(undefined),
      close: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      checkFlag: jest.fn(),
    })),
  };
});

describe('SchematicClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkFlag', () => {
    it('should return a boolean in offline mode', async () => {
      const client = new SchematicClient({
        offline: true,
        flagDefaults: { 'test-flag': true },
      });

      const result = await client.checkFlag({}, 'test-flag');
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);

      await client.close();
    });

    it('should return false by default in offline mode', async () => {
      const client = new SchematicClient({ offline: true });

      const result = await client.checkFlag({}, 'unknown-flag');
      expect(result).toBe(false);

      await client.close();
    });

    it('should use custom defaultValue option', async () => {
      const client = new SchematicClient({ offline: true });

      const result = await client.checkFlag({}, 'some-flag', { defaultValue: true });
      expect(result).toBe(true);

      await client.close();
    });

    it('should use defaultValue function option', async () => {
      const client = new SchematicClient({ offline: true });

      const result = await client.checkFlag({}, 'some-flag', {
        defaultValue: () => true,
      });
      expect(result).toBe(true);

      await client.close();
    });
  });

  describe('checkFlagWithEntitlement', () => {
    it('should return a CheckFlagWithEntitlementResponse in offline mode', async () => {
      const client = new SchematicClient({
        offline: true,
        flagDefaults: { 'test-flag': true },
      });

      const result = await client.checkFlagWithEntitlement({}, 'test-flag');
      expect(result).toEqual({
        flag: 'test-flag',
        reason: 'flag default',
        value: true,
      });

      await client.close();
    });

    it('should return default value false when no flag defaults set', async () => {
      const client = new SchematicClient({ offline: true });

      const result = await client.checkFlagWithEntitlement({}, 'unknown-flag');
      expect(result.value).toBe(false);
      expect(result.flag).toBe('unknown-flag');

      await client.close();
    });

    it('should use custom defaultValue option', async () => {
      const client = new SchematicClient({ offline: true });

      const result = await client.checkFlagWithEntitlement({}, 'some-flag', {
        defaultValue: true,
      });
      expect(result.value).toBe(true);
      expect(result.flag).toBe('some-flag');

      await client.close();
    });

    it('should not include entitlement in offline mode response', async () => {
      const client = new SchematicClient({ offline: true });

      const result = await client.checkFlagWithEntitlement({}, 'test-flag');
      expect(result.entitlement).toBeUndefined();

      await client.close();
    });

    it('should not include deprecated feature* fields', async () => {
      const client = new SchematicClient({ offline: true });

      const result: CheckFlagWithEntitlementResponse = await client.checkFlagWithEntitlement(
        {},
        'test-flag',
      );

      // Verify the response type does not have deprecated fields
      expect(result).not.toHaveProperty('featureAllocation');
      expect(result).not.toHaveProperty('featureUsage');
      expect(result).not.toHaveProperty('featureUsageEvent');
      expect(result).not.toHaveProperty('featureUsagePeriod');
      expect(result).not.toHaveProperty('featureUsageResetAt');

      await client.close();
    });
  });
});
