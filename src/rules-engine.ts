import { RulesEngineJS } from './wasm/rulesengine.js';

/** Result returned by the WASM rules engine (snake_case keys) */
export interface WasmCheckFlagResult {
    value: boolean;
    reason: string;
    rule_id?: string;
    flag_id?: string;
    flag_key?: string;
    company_id?: string;
    user_id?: string;
    rule_type?: string;
    err?: string;
}

export class RulesEngineClient {
    private wasmInstance: RulesEngineJS | null = null;
    private initialized = false;

    constructor() {}

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            this.wasmInstance = new RulesEngineJS();
            this.initialized = true;
        } catch (error) {
            throw new Error(`Failed to initialize WASM rules engine: ${error}`);
        }
    }

    async checkFlag(
        flag: object,
        company?: object | null,
        user?: object | null
    ): Promise<WasmCheckFlagResult> {
        this.ensureInitialized();

        // Strip null values — WASM/Rust serde expects arrays not null, and
        // uses #[serde(default)] to default missing fields to empty values.
        const stripNulls = (_key: string, value: unknown) => value === null ? undefined : value;

        try {
            const flagJson = JSON.stringify(flag, stripNulls);
            const companyJson = company ? JSON.stringify(company, stripNulls) : undefined;
            const userJson = user ? JSON.stringify(user, stripNulls) : undefined;

            const resultJson = this.wasmInstance!.checkFlag(
                flagJson,
                companyJson,
                userJson
            );

            return JSON.parse(resultJson);
        } catch (error) {
            throw new Error(`WASM flag check failed: ${error}`);
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