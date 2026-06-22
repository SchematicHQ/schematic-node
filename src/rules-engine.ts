import * as Schematic from "./api/types";
import type { CheckFlagOptions } from "./wrapper";

/** Entitlement details returned by the WASM rules engine  */
export interface WasmFeatureEntitlement {
    featureId: string;
    featureKey: string;
    valueType: Schematic.RulesengineEntitlementValueType;
    allocation?: number;
    softLimit?: number;
    usage?: number;
    eventName?: string;
    eventSubtype?: string;
    metricPeriod?: Schematic.RulesengineMetricPeriod;
    monthReset?: Schematic.RulesengineMetricPeriodMonthReset;
    metricResetAt?: string;
    creditId?: string;
    consumptionRate?: number;
    creditTotal?: number;
    creditUsed?: number;
    creditRemaining?: number;
    creditReserved?: number;
    creditSettled?: number;
}

/** Result returned by the WASM rules engine */
export interface WasmCheckFlagResult {
    value: boolean;
    reason: string;
    ruleId?: string;
    flagId?: string;
    flagKey?: string;
    companyId?: string;
    userId?: string;
    ruleType?: Schematic.RulesengineRuleType;
    err?: string;
    entitlement?: WasmFeatureEntitlement;
    featureAllocation?: number;
    featureUsage?: number;
    featureUsageEvent?: string;
    featureUsagePeriod?: string;
    featureUsageResetAt?: string;
}

export class RulesEngineClient {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private wasmInstance: any = null;
    private initialized = false;

    constructor() {}

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            // Load the WASM loader via dynamic import() so bundlers code-split it
            // into its own async chunk rather than inlining the (base64) binary
            // into a consumer's entry bundle. A consumer that only uses the HTTP
            // API and never reaches initialize() therefore doesn't ship the wasm.
            // The loader is a CommonJS module (wasm-bindgen nodejs target), so
            // unwrap the interop `default` before reading the export.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ns: any = await import("./wasm/rulesengine.js");
            const wasm = ns.RulesEngineJS ? ns : (ns.default ?? ns);
            this.wasmInstance = new wasm.RulesEngineJS();
            this.initialized = true;
        } catch (error) {
            throw new Error(`Failed to initialize WASM rules engine: ${error}`);
        }
    }

    async checkFlag(flag: object, company?: object | null, user?: object | null): Promise<WasmCheckFlagResult> {
        return this.checkFlagWithOptions(flag, company, user);
    }

    async checkFlagWithOptions(
        flag: object,
        company?: object | null,
        user?: object | null,
        options?: CheckFlagOptions | null,
    ): Promise<WasmCheckFlagResult> {
        this.ensureInitialized();

        // Strip null values — WASM/Rust serde expects arrays not null, and
        // uses #[serde(default)] to default missing fields to empty values.
        const stripNulls = (_key: string, value: unknown) => (value === null ? undefined : value);

        try {
            const flagJson = JSON.stringify(flag, stripNulls);
            const companyJson = company ? JSON.stringify(company, stripNulls) : undefined;
            const userJson = user ? JSON.stringify(user, stripNulls) : undefined;
            const optionsJson = options ? JSON.stringify(serializeCheckFlagOptions(options), stripNulls) : undefined;

            const resultJson = this.wasmInstance!.checkFlagWithOptions(flagJson, companyJson, userJson, optionsJson);

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
            throw new Error("WASM rules engine not initialized. Call initialize() first.");
        }
    }
}

// Serialize CheckFlagOptions to the snake_case envelope the WASM expects.
function serializeCheckFlagOptions(options: CheckFlagOptions): Record<string, unknown> {
    const envelope: Record<string, unknown> = {};
    if (options.creditCost && Object.keys(options.creditCost).length > 0) {
        envelope.credit_cost = options.creditCost;
    }
    if (options.usage !== undefined) {
        envelope.usage = options.usage;
    }
    if (options.eventUsage) {
        envelope.event_usage = {
            event_subtype: options.eventUsage.eventSubtype,
            quantity: options.eventUsage.quantity,
        };
    }
    return envelope;
}

// Export for backward compatibility
export { RulesEngineClient as default };
