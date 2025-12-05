import { RulesEngineClient } from './rules-engine';

// Mock data using realistic test data structures
const mockFlag = {
    id: 'test-flag',
    account_id: 'account-123',
    environment_id: 'env-123',
    key: 'test-feature',
    default_value: false,
    rules: [
        {
            id: 'rule-1',
            account_id: 'account-123',
            environment_id: 'env-123',
            name: 'Basic Access Rule',
            rule_type: 'plan_entitlement',
            priority: 100,
            value: true,
            conditions: [
                {
                    id: 'condition-1',
                    account_id: 'account-123',
                    environment_id: 'env-123',
                    condition_type: 'trait',
                    operator: 'lte',
                    resource_ids: [],
                    trait_value: '10'
                }
            ]
        }
    ]
};

const mockCompany = {
    id: 'company-123',
    account_id: 'account-123',
    environment_id: 'env-123',
    base_plan_id: 'plan-pro',
    billing_product_ids: [],
    crm_product_ids: [],
    keys: {
        id: 'company-123',
        slug: 'test-company'
    },
    plan_ids: ['plan-pro'],
    metrics: [],
    credit_balances: {},
    subscription: {
        id: 'sub-123',
        period_start: '2023-01-01T00:00:00Z',
        period_end: '2023-02-01T00:00:00Z'
    },
    traits: [],
    rules: []
};

const mockUser = {
    id: 'user-456',
    account_id: 'account-123',
    environment_id: 'env-123',
    keys: {
        id: 'user-456',
        email: 'test@example.com'
    },
    traits: [],
    rules: []
};

const mockRule = {
    id: 'test-rule',
    account_id: 'account-123',
    environment_id: 'env-123',
    name: 'Test Rule',
    rule_type: 'plan_entitlement',
    priority: 100,
    value: true,
    conditions: [
        {
            id: 'condition-2',
            account_id: 'account-123',
            environment_id: 'env-123',
            condition_type: 'trait',
            operator: 'eq',
            trait_value: 'pro'
        }
    ]
};

describe('RulesEngineClient', () => {
    let rulesEngine: RulesEngineClient;

    beforeEach(async () => {
        rulesEngine = new RulesEngineClient();
        await rulesEngine.initialize();
    });

    describe('Initialization', () => {
        test('should initialize successfully', async () => {
            const engine = new RulesEngineClient();
            await engine.initialize();
            expect(engine.isInitialized()).toBe(true);
        });

        test('should not reinitialize if already initialized', async () => {
            expect(rulesEngine.isInitialized()).toBe(true);
            // Should not throw
            await rulesEngine.initialize();
            expect(rulesEngine.isInitialized()).toBe(true);
        });

        test('should throw error when using methods before initialization', async () => {
            const engine = new RulesEngineClient();
            expect(() => engine.getVersionKey()).toThrow('WASM rules engine not initialized');
        });
    });

    describe('Version Information', () => {
        test('should return version key', () => {
            const version = rulesEngine.getVersionKey();
            expect(version).toBeDefined();
            expect(typeof version).toBe('string');
            expect(version.length).toBeGreaterThan(0);
        });
    });

    describe('Flag Checking', () => {
        test('should check flag with company and user context', async () => {
            const result = await rulesEngine.checkFlag(mockFlag, mockCompany, mockUser);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
            expect(result).toHaveProperty('value');
            expect(result).toHaveProperty('reason');
            expect(result).toHaveProperty('rule_id');
        });

        test('should check flag with only company context', async () => {
            const result = await rulesEngine.checkFlag(mockFlag, mockCompany);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });

        test('should check flag with only user context', async () => {
            const result = await rulesEngine.checkFlag(mockFlag, undefined, mockUser);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });

        test('should check flag without context', async () => {
            const result = await rulesEngine.checkFlag(mockFlag);
            
            expect(result).toBeDefined();
            expect(typeof result).toBe('object');
        });

        test('should handle invalid flag JSON', async () => {
            const invalidFlag = { id: 'test', invalid_field: undefined };
            
            // Should reject invalid data structures that don't match the expected schema
            await expect(rulesEngine.checkFlag(invalidFlag)).rejects.toThrow();
        });

        test('should return consistent results for identical inputs', async () => {
            const result1 = await rulesEngine.checkFlag(mockFlag, mockCompany, mockUser);
            const result2 = await rulesEngine.checkFlag(mockFlag, mockCompany, mockUser);
            
            expect(result1).toEqual(result2);
        });
    });

    describe('Rule Evaluation', () => {
        test('should evaluate rule with company and user context', async () => {
            const result = await rulesEngine.evaluateRule(mockRule, mockCompany, mockUser);
            
            expect(typeof result).toBe('boolean');
        });

        test('should evaluate rule with only company context', async () => {
            const result = await rulesEngine.evaluateRule(mockRule, mockCompany);
            
            expect(typeof result).toBe('boolean');
        });

        test('should evaluate rule without context', async () => {
            const result = await rulesEngine.evaluateRule(mockRule);
            
            expect(typeof result).toBe('boolean');
        });

        test('should handle complex rule conditions', async () => {
            const complexRule = {
                ...mockRule,
                conditions: [
                    {
                        id: 'condition-3',
                        account_id: 'account-123',
                        environment_id: 'env-123',
                        condition_type: 'trait',
                        operator: 'eq',
                        trait_value: 'pro'
                    },
                    {
                        id: 'condition-4',
                        account_id: 'account-123',
                        environment_id: 'env-123',
                        condition_type: 'trait',
                        operator: 'gte',
                        trait_value: '1'
                    }
                ]
            };

            const result = await rulesEngine.evaluateRule(complexRule, mockCompany, mockUser);
            expect(typeof result).toBe('boolean');
        });

        test('should return consistent results for identical rule inputs', async () => {
            const result1 = await rulesEngine.evaluateRule(mockRule, mockCompany, mockUser);
            const result2 = await rulesEngine.evaluateRule(mockRule, mockCompany, mockUser);
            
            expect(result1).toBe(result2);
        });
    });

    describe('Error Handling', () => {
        test('should handle malformed JSON gracefully', async () => {
            // Test with circular reference (should be handled by JSON.stringify error)
            const circularFlag = { ...mockFlag };
            (circularFlag as any).self = circularFlag;
            
            await expect(rulesEngine.checkFlag(circularFlag)).rejects.toThrow();
        });

        test('should provide meaningful error messages', async () => {
            try {
                await rulesEngine.checkFlag(null as any);
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                expect((error as Error).message).toContain('WASM flag check failed');
            }
        });
    });

    describe('Performance', () => {
        test('should handle multiple concurrent operations', async () => {
            const promises = Array.from({ length: 10 }, (_, i) => 
                rulesEngine.checkFlag({ ...mockFlag, id: `flag-${i}` }, mockCompany, mockUser)
            );
            
            const results = await Promise.all(promises);
            expect(results).toHaveLength(10);
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(typeof result).toBe('object');
            });
        });

        test('should complete operations within reasonable time', async () => {
            const start = Date.now();
            
            await rulesEngine.checkFlag(mockFlag, mockCompany, mockUser);
            
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(100); // Should complete within 100ms
        });
    });

    describe('Memory Management', () => {
        test('should handle large datasets without memory leaks', async () => {
            const largeCompany = {
                ...mockCompany,
                traits: [
                    // Add many traits to test memory handling
                    ...Array.from({ length: 1000 }, (_, i) => ({
                        value: `value_${i}`,
                        trait_definition: {
                            id: `trait_${i}`,
                            comparable_type: 'string',
                            entity_type: 'company'
                        }
                    }))
                ]
            };

            // Should complete without throwing memory errors
            const result = await rulesEngine.checkFlag(mockFlag, largeCompany, mockUser);
            expect(result).toBeDefined();
        });
    });
});

describe('Module Exports', () => {
        test('should export RulesEngineClient as named export', () => {
            expect(RulesEngineClient).toBeDefined();
            expect(typeof RulesEngineClient).toBe('function');
        });    test('should export default export', async () => {
        const { default: DefaultExport } = await import('./rules-engine');
        expect(DefaultExport).toBe(RulesEngineClient);
    });
});