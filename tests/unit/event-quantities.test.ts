import * as fs from "fs";
import * as path from "path";

import { RulesEngineClient } from "../../src/rules-engine";
import type { CheckFlagOptions } from "../../src/wrapper";

/**
 * The `eventQuantities` preflight and the `quantity_rates` it prices from,
 * run through the WASM engine with the snake_case payloads DataStream sends.
 */

const SUBTYPE = "chat";
const CREDIT_ID = "credit-abc";

// A single credit-balance rule priced like an inference entitlement: requests
// at consumptionRate, tokens at their own rates.
const inferenceFlag = (consumptionRate: number, quantityRates?: Record<string, number>) => ({
    id: "flag-1",
    account_id: "account-123",
    environment_id: "env-123",
    key: "chat",
    default_value: false,
    rules: [
        {
            id: "rule-1",
            account_id: "account-123",
            environment_id: "env-123",
            name: "Credits",
            rule_type: "plan_entitlement",
            priority: 0,
            value: true,
            conditions: [
                {
                    id: "cond-1",
                    account_id: "account-123",
                    environment_id: "env-123",
                    condition_type: "credit",
                    operator: "lt",
                    resource_ids: [],
                    credit_id: CREDIT_ID,
                    consumption_rate: consumptionRate,
                    event_subtype: SUBTYPE,
                    trait_value: "",
                    ...(quantityRates ? { quantity_rates: quantityRates } : {}),
                },
            ],
            condition_groups: [],
        },
    ],
});

const companyWithBalance = (balance: number) => ({
    id: "company-1",
    account_id: "account-123",
    environment_id: "env-123",
    keys: { id: "company-1" },
    billing_product_ids: [],
    crm_product_ids: [],
    credit_balances: { [CREDIT_ID]: balance },
    plan_ids: [],
    metrics: [],
    traits: [],
    rules: [],
});

describe("eventQuantities preflight", () => {
    let engine: RulesEngineClient;

    beforeAll(async () => {
        engine = new RulesEngineClient();
        await engine.initialize();
    });

    const rates = { input_tokens: 0.001, output_tokens: 0.01 };
    // 1 request × 0.5 + (1000 − 400 cached) × 0.001 + 100 × 0.01 = 2.1. The
    // cached tokens are unrated, so they cost nothing but still come out of
    // input.
    const quantities = { input_tokens: 1000, cached_input_tokens: 400, output_tokens: 100 };
    const call: CheckFlagOptions = { eventQuantities: { eventSubtype: SUBTYPE, quantities } };
    const check = (balance: number, options: CheckFlagOptions) =>
        engine.checkFlagWithOptions(inferenceFlag(0.5, rates), companyWithBalance(balance), null, options);

    test("passes when the balance covers the call", async () => {
        const result = await check(2.1, call);
        expect(result.ruleId).toBe("rule-1");
        expect(result.value).toBe(true);
    });

    test("refuses when the balance falls short", async () => {
        // Covers the request and the legacy single unit, not the tokens.
        const result = await check(2.0, call);
        expect(result.ruleId).toBeFalsy();
        expect(result.value).toBe(false);
    });

    test("ignored for another subtype", async () => {
        const result = await check(1.0, {
            eventQuantities: { eventSubtype: "other", quantities: { input_tokens: 1e6 } },
        });
        expect(result.ruleId).toBe("rule-1");
    });

    test("quantity multiplies the base, not the quantities", async () => {
        // 3 × 0.5 + 600 × 0.001 + 100 × 0.01 = 3.1.
        const options = { eventQuantities: { eventSubtype: SUBTYPE, quantity: 3, quantities } };
        expect((await check(3.1, options)).ruleId).toBe("rule-1");
        expect((await check(3.0, options)).ruleId).toBeFalsy();
    });

    test("creditCost beats eventQuantities", async () => {
        const result = await check(1.0, { ...call, creditCost: { [CREDIT_ID]: 1.0 } });
        expect(result.ruleId).toBe("rule-1");
    });

    test("eventQuantities beats eventUsage", async () => {
        // eventUsage alone would ask 1 × 0.5, which 2.0 covers.
        const result = await check(2.0, { ...call, eventUsage: { eventSubtype: SUBTYPE, quantity: 1 } });
        expect(result.ruleId).toBeFalsy();
    });

    test("passes fractional quantities through unrounded", async () => {
        // 0.5 + 0.5 × 0.01 = 0.505; rounding the half token up would ask 0.51.
        const options = { eventQuantities: { eventSubtype: SUBTYPE, quantities: { output_tokens: 0.5 } } };
        expect((await check(0.505, options)).ruleId).toBe("rule-1");
    });

    test.each([
        ["quantity", { eventSubtype: SUBTYPE, quantity: -1 }],
        ["quantities", { eventSubtype: SUBTYPE, quantities: { input_tokens: -1 } }],
    ])("rejects a negative %s", async (_name, eventQuantities) => {
        const result = await check(100, { eventQuantities });
        expect(result.value).toBe(false);
        expect(result.err).toBeTruthy();
    });

    test("a company entitlement's quantity_rates reaches the result", async () => {
        const flag = inferenceFlag(0.5);
        const company = {
            ...companyWithBalance(0),
            entitlements: [
                {
                    feature_id: "feat-1",
                    feature_key: flag.key,
                    value_type: "credit",
                    quantity_rates: rates,
                },
            ],
        };

        const result = await engine.checkFlagWithOptions(flag, company);

        expect(result.entitlement?.quantityRates).toEqual(rates);
    });

    // tests/unit/testdata/quantity_cost.json is copied verbatim from
    // schematic-api's api/lib/rulesengine/testdata/quantity_cost.json. The API's
    // burn and the engine both price every case there; running them through
    // the WASM engine here pins that this SDK's wire shape for quantity_rates
    // and event_quantities reaches that pricing intact.
    describe("shared quantity_cost fixture", () => {
        interface QuantityCostCase {
            name: string;
            consumption_rate: number;
            quantity_rates?: Record<string, number>;
            quantity?: number;
            quantities?: Record<string, number>;
            expected_cost: number;
        }
        const fixture: { cases: QuantityCostCase[] } = JSON.parse(
            fs.readFileSync(path.join(__dirname, "testdata", "quantity_cost.json"), "utf8"),
        );
        // The preflight rejects negative quantities before pricing.
        const cases = fixture.cases.filter(
            (c) => (c.quantity ?? 0) >= 0 && Object.values(c.quantities ?? {}).every((q) => q >= 0),
        );

        test("has cases", () => {
            expect(cases.length).toBeGreaterThan(0);
        });

        test.each(cases.map((c) => [c.name, c] as const))("%s", async (_name, tc) => {
            const flag = inferenceFlag(tc.consumption_rate, tc.quantity_rates);
            const options: CheckFlagOptions = {
                eventQuantities: { eventSubtype: SUBTYPE, quantity: tc.quantity, quantities: tc.quantities },
            };

            // A cost priced to zero gates on balance > 0, so the smallest
            // positive balance passes and zero does not.
            const covers = tc.expected_cost * (1 + 1e-9) + 1e-9;
            const short = tc.expected_cost === 0 ? 0 : tc.expected_cost * (1 - 1e-6);

            const pass = await engine.checkFlagWithOptions(flag, companyWithBalance(covers), null, options);
            expect(pass.ruleId).toBe("rule-1");

            const fail = await engine.checkFlagWithOptions(flag, companyWithBalance(short), null, options);
            expect(fail.ruleId).toBeFalsy();
        });
    });
});
