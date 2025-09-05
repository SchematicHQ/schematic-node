import { SchematicClient } from "../src/wrapper";
import { LocalCache } from "../src/cache";
import * as api from "../src/api";

describe('SchematicClient checkFlags wrapper', () => {
    let client: SchematicClient;

    beforeEach(() => {
        client = new SchematicClient({
            apiKey: 'test-key',
            offline: true, // Use offline mode to avoid real API calls
            cacheProviders: {
                flagChecks: [new LocalCache()]
            }
        });
    });

    describe('checkFlags offline mode', () => {
        it('should return default values in offline mode with specific keys', async () => {
            const evalCtx: api.CheckFlagRequestBody = {
                company: { id: 'test-company' }
            };

            const result = await client.checkFlags(evalCtx, ['flag1', 'flag2']);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                flag: 'flag1',
                value: false, // default value
                reason: 'Offline mode - using default value'
            });
            expect(result[1]).toEqual({
                flag: 'flag2',
                value: false, // default value
                reason: 'Offline mode - using default value'
            });
        });

        it('should return empty array in offline mode without keys', async () => {
            const evalCtx: api.CheckFlagRequestBody = {
                company: { id: 'test-company' }
            };

            const result = await client.checkFlags(evalCtx);

            expect(result).toEqual([]);
        });

        it('should return empty array in offline mode with empty keys array', async () => {
            const evalCtx: api.CheckFlagRequestBody = {
                company: { id: 'test-company' }
            };

            const result = await client.checkFlags(evalCtx, []);

            expect(result).toEqual([]);
        });
    });

    describe('checkFlags with custom flag defaults', () => {
        beforeEach(() => {
            client = new SchematicClient({
                apiKey: 'test-key',
                offline: true,
                flagDefaults: {
                    'flag1': true,
                    'flag2': false
                },
                cacheProviders: {
                    flagChecks: [new LocalCache()]
                }
            });
        });

        it('should return custom default values when specified', async () => {
            const evalCtx: api.CheckFlagRequestBody = {
                company: { id: 'test-company' }
            };

            const result = await client.checkFlags(evalCtx, ['flag1', 'flag2', 'flag3']);

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({
                flag: 'flag1',
                value: true, // custom default
                reason: 'Offline mode - using default value'
            });
            expect(result[1]).toEqual({
                flag: 'flag2',
                value: false, // custom default
                reason: 'Offline mode - using default value'
            });
            expect(result[2]).toEqual({
                flag: 'flag3',
                value: false, // global default (not specified)
                reason: 'Offline mode - using default value'
            });
        });
    });

    describe('checkFlags parameter validation', () => {
        it('should handle undefined keys parameter', async () => {
            const evalCtx: api.CheckFlagRequestBody = {
                company: { id: 'test-company' }
            };

            const result = await client.checkFlags(evalCtx, undefined);

            expect(result).toEqual([]);
        });

        it('should handle null keys parameter', async () => {
            const evalCtx: api.CheckFlagRequestBody = {
                company: { id: 'test-company' }
            };

            const result = await client.checkFlags(evalCtx, null as any);

            expect(result).toEqual([]);
        });
    });

    describe('checkFlags API signature compatibility', () => {
        it('should accept same evaluation context as checkFlag', async () => {
            const evalCtx: api.CheckFlagRequestBody = {
                company: { 
                    id: 'test-company',
                    name: 'Test Company'
                },
                user: {
                    id: 'test-user',
                    email: 'test@example.com'
                }
            };

            // Should not throw type errors
            const result = await client.checkFlags(evalCtx, ['flag1']);
            
            expect(result).toHaveLength(1);
            expect(result[0].flag).toBe('flag1');
        });

        it('should return properly typed CheckFlagResponseData array', async () => {
            const evalCtx: api.CheckFlagRequestBody = {
                company: { id: 'test-company' }
            };

            const result = await client.checkFlags(evalCtx, ['flag1']);

            // Type assertion to verify the return type matches the expected interface
            expect(result).toHaveLength(1);
            
            const flagResult = result[0];
            expect(typeof flagResult.flag).toBe('string');
            expect(typeof flagResult.value).toBe('boolean');
            expect(typeof flagResult.reason).toBe('string');
            
            // These properties are optional in the interface
            expect(flagResult.companyId).toBeUndefined();
            expect(flagResult.userId).toBeUndefined();
            expect(flagResult.flagId).toBeUndefined();
            expect(flagResult.ruleId).toBeUndefined();
        });
    });
});
