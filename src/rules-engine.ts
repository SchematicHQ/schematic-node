import { RulesEngineJS } from './wasm/rulesengine.js';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * High-performance rules engine for flag evaluation and rule processing.
 * 
 * This engine provides significant performance improvements over traditional JavaScript
 * implementations by leveraging compiled Rust code running in WebAssembly.
 */
export class RulesEngineClient {
    private wasmInstance: RulesEngineJS | null = null;
    private initialized = false;

    constructor() {}

    /**
     * Initialize the WASM rules engine.
     * Must be called before using any other methods.
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            // Initialize the WASM module
            this.wasmInstance = new RulesEngineJS();
            this.initialized = true;
        } catch (error) {
            throw new Error(`Failed to initialize WASM rules engine: ${error}`);
        }
    }

    /**
     * Check a feature flag using the WASM engine.
     * 
     * @param flag - The flag configuration object
     * @param company - Optional company context
     * @param user - Optional user context
     * @returns Promise resolving to the flag check result
     */
    async checkFlag(
        flag: any,
        company?: any,
        user?: any
    ): Promise<any> {
        this.ensureInitialized();

        try {
            const flagJson = JSON.stringify(flag);
            const companyJson = company ? JSON.stringify(company) : undefined;
            const userJson = user ? JSON.stringify(user) : undefined;

            const resultJson = this.wasmInstance!.checkFlag(
                flagJson,
                companyJson,
                userJson
            );

            // The WASM function returns a JSON-encoded string, so we need to parse twice
            const jsonString = JSON.parse(resultJson); // First parse to get the actual JSON string
            return JSON.parse(jsonString); // Second parse to get the object
        } catch (error) {
            throw new Error(`WASM flag check failed: ${error}`);
        }
    }

    /**
     * Evaluate a rule using the WASM engine.
     * 
     * @param rule - The rule configuration object
     * @param company - Optional company context
     * @param user - Optional user context
     * @returns Promise resolving to boolean indicating if rule matched
     */
    async evaluateRule(
        rule: any,
        company?: any,
        user?: any
    ): Promise<boolean> {
        this.ensureInitialized();

        try {
            const ruleJson = JSON.stringify(rule);
            const companyJson = company ? JSON.stringify(company) : undefined;
            const userJson = user ? JSON.stringify(user) : undefined;

            return this.wasmInstance!.evaluateRule(
                ruleJson,
                companyJson,
                userJson
            );
        } catch (error) {
            throw new Error(`WASM rule evaluation failed: ${error}`);
        }
    }

    /**
     * Get the version key of the WASM rules engine.
     * Useful for debugging and compatibility checking.
     */
    getVersionKey(): string {
        this.ensureInitialized();
        return this.wasmInstance!.getVersionKey();
    }

    /**
     * Check if the engine is initialized.
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    private ensureInitialized(): void {
        if (!this.initialized || !this.wasmInstance) {
            throw new Error('WASM rules engine not initialized. Call initialize() first.');
        }
    }
}

// Export for backward compatibility
export { RulesEngineClient as default };