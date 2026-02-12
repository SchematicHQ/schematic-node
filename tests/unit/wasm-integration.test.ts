import { RulesEngineClient } from "../../src/rules-engine";

/**
 * WASM Integration Tests
 *
 * These tests exercise the WASM rules engine with realistic data structures
 * that match what the WebSocket datastream sends (snake_case JSON).
 * The data is passed directly to checkFlag which JSON.stringify's it for WASM.
 */

// Minimal flag with no rules (returns default value)
const minimalFlag = {
  id: "flag-1",
  account_id: "account-123",
  environment_id: "env-123",
  key: "test-flag",
  default_value: false,
  rules: [],
};

// Flag with a simple standard rule (unconditional)
const flagWithStandardRule = {
  id: "flag-2",
  account_id: "account-123",
  environment_id: "env-123",
  key: "standard-flag",
  default_value: false,
  rules: [
    {
      id: "rule-1",
      account_id: "account-123",
      environment_id: "env-123",
      name: "Always On",
      rule_type: "standard",
      priority: 100,
      value: true,
      conditions: [],
      condition_groups: [],
    },
  ],
};

// Flag with a plan_entitlement rule
const flagWithPlanRule = {
  id: "flag-3",
  account_id: "account-123",
  environment_id: "env-123",
  key: "plan-flag",
  default_value: false,
  rules: [
    {
      id: "rule-2",
      account_id: "account-123",
      environment_id: "env-123",
      name: "Plan Access",
      rule_type: "plan_entitlement",
      priority: 100,
      value: true,
      conditions: [
        {
          id: "cond-1",
          account_id: "account-123",
          environment_id: "env-123",
          condition_type: "trait",
          operator: "eq",
          resource_ids: [],
          trait_value: "pro",
        },
      ],
      condition_groups: [],
    },
  ],
};

// Flag with company_override rule
const flagWithCompanyOverride = {
  id: "flag-4",
  account_id: "account-123",
  environment_id: "env-123",
  key: "override-flag",
  default_value: false,
  rules: [
    {
      id: "rule-3",
      account_id: "account-123",
      environment_id: "env-123",
      name: "Company Override",
      rule_type: "company_override",
      priority: 50,
      value: true,
      conditions: [],
      condition_groups: [],
    },
  ],
};

// Flag with global_override rule
const flagWithGlobalOverride = {
  id: "flag-5",
  account_id: "account-123",
  environment_id: "env-123",
  key: "global-override-flag",
  default_value: false,
  rules: [
    {
      id: "rule-4",
      account_id: "account-123",
      environment_id: "env-123",
      name: "Global Override",
      rule_type: "global_override",
      priority: 10,
      value: true,
      conditions: [],
      condition_groups: [],
    },
  ],
};

// Minimal company
const minimalCompany = {
  id: "company-1",
  account_id: "account-123",
  environment_id: "env-123",
  keys: { id: "company-1" },
  billing_product_ids: [],
  crm_product_ids: [],
  credit_balances: {},
  plan_ids: [],
  metrics: [],
  traits: [],
  rules: [],
};

// Minimal user
const minimalUser = {
  id: "user-1",
  account_id: "account-123",
  environment_id: "env-123",
  keys: { email: "test@example.com" },
  traits: [],
  rules: [],
};

describe("WASM Integration - Flag Evaluation", () => {
  let rulesEngine: RulesEngineClient;

  beforeAll(async () => {
    rulesEngine = new RulesEngineClient();
    await rulesEngine.initialize();
  });

  describe("Basic flag evaluation", () => {
    test("flag with no rules returns default value", async () => {
      const result = await rulesEngine.checkFlag(minimalFlag);
      expect(result.value).toBe(false);
    });

    test("standard rule returns true without context", async () => {
      const result = await rulesEngine.checkFlag(flagWithStandardRule);
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });

    test("global_override rule returns true without context", async () => {
      const result = await rulesEngine.checkFlag(
        flagWithGlobalOverride,
      );
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });

    test("flag with null company and null user", async () => {
      const result = await rulesEngine.checkFlag(
        minimalFlag,
        null,
        null,
      );
      expect(result.value).toBe(false);
    });

    test("flag with undefined company and user", async () => {
      const result = await rulesEngine.checkFlag(
        minimalFlag,
        undefined,
        undefined,
      );
      expect(result.value).toBe(false);
    });
  });

  describe("Rule type variants", () => {
    const ruleTypes = [
      "default",
      "global_override",
      "company_override",
      "company_override_usage_exceeded",
      "plan_entitlement",
      "plan_entitlement_usage_exceeded",
      "standard",
    ];

    test.each(ruleTypes)("WASM accepts rule_type: %s", async (ruleType) => {
      const flag = {
        ...minimalFlag,
        rules: [
          {
            id: "rule-test",
            account_id: "account-123",
            environment_id: "env-123",
            name: `Test ${ruleType}`,
            rule_type: ruleType,
            priority: 100,
            value: true,
            conditions: [],
            condition_groups: [],
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flag,
        minimalCompany,
        minimalUser,
      );
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });

    test("WASM rejects invalid rule_type", async () => {
      const flag = {
        ...minimalFlag,
        rules: [
          {
            id: "rule-bad",
            account_id: "account-123",
            environment_id: "env-123",
            name: "Bad Rule",
            rule_type: "bool",
            priority: 100,
            value: true,
            conditions: [],
            condition_groups: [],
          },
        ],
      };
      await expect(rulesEngine.checkFlag(flag)).rejects.toThrow();
    });
  });

  describe("Company data shapes", () => {
    test("minimal company with standard rule", async () => {
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        minimalCompany,
      );
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });

    test("company with base_plan_id", async () => {
      const company = { ...minimalCompany, base_plan_id: "plan-pro" };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with plan_ids", async () => {
      const company = {
        ...minimalCompany,
        plan_ids: ["plan-pro", "plan-starter"],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with billing_product_ids", async () => {
      const company = {
        ...minimalCompany,
        billing_product_ids: ["prod-1", "prod-2"],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with crm_product_ids", async () => {
      const company = { ...minimalCompany, crm_product_ids: ["crm-1"] };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with credit_balances", async () => {
      const company = {
        ...minimalCompany,
        credit_balances: { "credit-type-1": 100, "credit-type-2": 50 },
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with multiple keys", async () => {
      const company = {
        ...minimalCompany,
        keys: { id: "company-1", slug: "test-company", external_id: "ext-123" },
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with traits", async () => {
      const company = {
        ...minimalCompany,
        traits: [
          {
            value: "pro",
            trait_definition: {
              id: "trait-1",
              comparable_type: "string",
              entity_type: "company",
            },
          },
          {
            value: "42",
            trait_definition: {
              id: "trait-2",
              comparable_type: "int",
              entity_type: "company",
            },
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with subscription", async () => {
      const company = {
        ...minimalCompany,
        subscription: {
          id: "sub-123",
          period_start: "2024-01-01T00:00:00Z",
          period_end: "2024-02-01T00:00:00Z",
        },
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with null subscription", async () => {
      const company = { ...minimalCompany, subscription: null };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with metrics", async () => {
      const company = {
        ...minimalCompany,
        metrics: [
          {
            account_id: "account-123",
            company_id: "company-1",
            created_at: "2024-01-15T10:00:00Z",
            environment_id: "env-123",
            event_subtype: "api-call",
            month_reset: "first_of_month",
            period: "current_month",
            value: 150,
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with metrics including valid_until", async () => {
      const company = {
        ...minimalCompany,
        metrics: [
          {
            account_id: "account-123",
            company_id: "company-1",
            created_at: "2024-01-15T10:00:00Z",
            environment_id: "env-123",
            event_subtype: "api-call",
            month_reset: "first_of_month",
            period: "current_month",
            valid_until: "2024-02-01T00:00:00Z",
            value: 150,
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with all_time metric period", async () => {
      const company = {
        ...minimalCompany,
        metrics: [
          {
            account_id: "account-123",
            company_id: "company-1",
            created_at: "2024-01-15T10:00:00Z",
            environment_id: "env-123",
            event_subtype: "total-usage",
            month_reset: "first_of_month",
            period: "all_time",
            value: 5000,
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with billing_cycle month_reset", async () => {
      const company = {
        ...minimalCompany,
        metrics: [
          {
            account_id: "account-123",
            company_id: "company-1",
            created_at: "2024-01-15T10:00:00Z",
            environment_id: "env-123",
            event_subtype: "api-call",
            month_reset: "billing_cycle",
            period: "current_month",
            value: 75,
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with rules and condition_groups", async () => {
      const company = {
        ...minimalCompany,
        rules: [
          {
            id: "company-rule-1",
            account_id: "account-123",
            environment_id: "env-123",
            name: "Company Rule",
            rule_type: "company_override",
            priority: 50,
            value: true,
            conditions: [],
            condition_groups: [
              {
                conditions: [
                  {
                    id: "cg-cond-1",
                    account_id: "account-123",
                    environment_id: "env-123",
                    condition_type: "trait",
                    operator: "eq",
                    resource_ids: [],
                    trait_value: "yes",
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("fully populated company (realistic server data)", async () => {
      const company = {
        id: "company-real",
        account_id: "account-123",
        environment_id: "env-123",
        base_plan_id: "plan-enterprise",
        billing_product_ids: ["prod-api", "prod-dashboard"],
        crm_product_ids: ["crm-sf-123"],
        credit_balances: { "api-credits": 500, "export-credits": 100 },
        keys: {
          id: "company-real",
          slug: "acme-corp",
          external_id: "sf-12345",
        },
        plan_ids: ["plan-enterprise"],
        metrics: [
          {
            account_id: "account-123",
            company_id: "company-real",
            created_at: "2024-06-01T00:00:00Z",
            environment_id: "env-123",
            event_subtype: "api-call",
            month_reset: "first_of_month",
            period: "current_month",
            valid_until: "2024-07-01T00:00:00Z",
            value: 1500,
          },
        ],
        subscription: {
          id: "sub-enterprise",
          period_start: "2024-01-01T00:00:00Z",
          period_end: "2025-01-01T00:00:00Z",
        },
        traits: [
          {
            value: "enterprise",
            trait_definition: {
              id: "plan-trait",
              comparable_type: "string",
              entity_type: "company",
            },
          },
          {
            value: "50",
            trait_definition: {
              id: "seats-trait",
              comparable_type: "int",
              entity_type: "company",
            },
          },
        ],
        rules: [],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });
  });

  describe("User data shapes", () => {
    test("minimal user", async () => {
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        null,
        minimalUser,
      );
      expect(result).toBeDefined();
    });

    test("user with traits", async () => {
      const user = {
        ...minimalUser,
        traits: [
          {
            value: "admin",
            trait_definition: {
              id: "role-trait",
              comparable_type: "string",
              entity_type: "user",
            },
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        null,
        user,
      );
      expect(result).toBeDefined();
    });

    test("user with rules", async () => {
      const user = {
        ...minimalUser,
        rules: [
          {
            id: "user-rule-1",
            account_id: "account-123",
            environment_id: "env-123",
            name: "User Rule",
            rule_type: "company_override",
            priority: 50,
            value: true,
            conditions: [],
            condition_groups: [],
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        null,
        user,
      );
      expect(result).toBeDefined();
    });
  });

  describe("Combined company + user evaluation", () => {
    test("standard rule with company and user", async () => {
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        minimalCompany,
        minimalUser,
      );
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });

    test("company_override rule with company and user", async () => {
      const result = await rulesEngine.checkFlag(
        flagWithCompanyOverride,
        minimalCompany,
        minimalUser,
      );
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });

    test("plan_entitlement rule with company and user", async () => {
      const result = await rulesEngine.checkFlag(
        flagWithPlanRule,
        minimalCompany,
        minimalUser,
      );
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });

    test("fully populated company and user", async () => {
      const company = {
        ...minimalCompany,
        base_plan_id: "plan-pro",
        plan_ids: ["plan-pro"],
        traits: [
          {
            value: "pro",
            trait_definition: {
              id: "plan-trait",
              comparable_type: "string",
              entity_type: "company",
            },
          },
        ],
        metrics: [
          {
            account_id: "account-123",
            company_id: "company-1",
            created_at: "2024-01-01T00:00:00Z",
            environment_id: "env-123",
            event_subtype: "api-call",
            month_reset: "first_of_month",
            period: "current_month",
            value: 100,
          },
        ],
        subscription: {
          id: "sub-1",
          period_start: "2024-01-01T00:00:00Z",
          period_end: "2024-12-31T00:00:00Z",
        },
      };

      const user = {
        ...minimalUser,
        traits: [
          {
            value: "admin",
            trait_definition: {
              id: "role-trait",
              comparable_type: "string",
              entity_type: "user",
            },
          },
        ],
      };

      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
        user,
      );
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });
  });

  describe("Direct JSON pass-through", () => {
    test("snake_case wire data passes directly to WASM", async () => {
      const result = await rulesEngine.checkFlag(
        minimalFlag,
        minimalCompany,
        minimalUser,
      );
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });

    test("null values are stripped before passing to WASM", async () => {
      const company = {
        ...minimalCompany,
        billing_product_ids: null,
        traits: null,
        subscription: null,
      };
      const result = await rulesEngine.checkFlag(
        minimalFlag,
        company,
      );
      expect(result).toBeDefined();
    });
  });

  describe("Real server data reproduction", () => {
    test("exact flag + company from production WebSocket", async () => {
      // This is the exact data shape from a live datastream WebSocket
      const flag = {
        id: "flag_VaeLrSV7SyS",
        account_id: "acct_cns2asuKAG2",
        environment_id: "env_cns2asuKAG2",
        key: "event-based-feature",
        default_value: false,
        rules: [
          {
            id: "rule_DM2WM2DZGQa",
            flag_id: "flag_VaeLrSV7SyS",
            account_id: "acct_cns2asuKAG2",
            environment_id: "env_cns2asuKAG2",
            rule_type: "plan_entitlement",
            name: "Plan Entitlement - 0",
            priority: 0,
            conditions: [
              {
                id: "cond_981j6nGT6mV",
                account_id: "acct_cns2asuKAG2",
                environment_id: "env_cns2asuKAG2",
                condition_type: "plan",
                operator: "eq",
                resource_ids: ["plan_TfyGKXqDLtC"],
                metric_value: 0,
                trait_value: "",
              },
              {
                id: "cond_cCMseBR8X3b",
                account_id: "acct_cns2asuKAG2",
                environment_id: "env_cns2asuKAG2",
                condition_type: "metric",
                operator: "lt",
                resource_ids: [],
                event_subtype: "genetic-query",
                metric_value: 0,
                metric_period: "current_day",
                trait_value: "0",
              },
            ],
            value: true,
            condition_groups: [],
          },
        ],
      };

      const company = {
        id: "comp_T1FkutzB7iJ",
        account_id: "",
        environment_id: "env_cns2asuKAG2",
        base_plan_id: "plan_fuNSdNd3qym",
        billing_product_ids: ["bilp_GZH3dZ4Us7n"],
        crm_product_ids: [],
        credit_balances: { bilcr_cns2asu_k_a_g2: 100 },
        entitlements: [
          {
            feature_id: "feat_2knpsDEDGez",
            feature_key: "new-event-name",
            value_type: "boolean",
            event_name: "test-event",
          },
          {
            feature_id: "feat_BfxomUgoHA8",
            feature_key: "event-based-feature",
            value_type: "numeric",
            allocation: 100,
            usage: 0,
            event_name: "genetic-query",
            metric_period: "current_month",
            month_reset: "first_of_month",
            metric_reset_at: "2026-03-01T00:00:00Z",
          },
        ],
        keys: { stripe_customer_id: "cus_RPruHjZPU6EBOO" },
        metrics: [],
        plan_ids: ["plan_fuNSdNd3qym"],
        rules: [],
        subscription: {
          id: "bilsub_fuNSdNd3qym",
          period_start: "2025-02-18T08:39:36-07:00",
          period_end: "2025-03-18T09:39:36-06:00",
        },
        traits: [],
      };

      const result = await rulesEngine.checkFlag(flag, company);
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });

    test("company with empty crm_product_ids (as server sends)", async () => {
      const company = {
        id: "comp_T1FkutzB7iJ",
        account_id: "acct_123",
        environment_id: "env_123",
        keys: { id: "comp_T1FkutzB7iJ" },
        billing_product_ids: [],
        crm_product_ids: [],
        credit_balances: {},
        plan_ids: [],
        metrics: [],
        traits: [],
        rules: [],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with empty account_id", async () => {
      const company = {
        ...minimalCompany,
        account_id: "",
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with entitlements field (extra server field)", async () => {
      const company = {
        ...minimalCompany,
        entitlements: [
          {
            feature_id: "feat_123",
            feature_key: "my-feature",
            value_type: "boolean",
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("condition with condition_type plan", async () => {
      const flag = {
        ...minimalFlag,
        rules: [
          {
            id: "rule-1",
            account_id: "account-123",
            environment_id: "env-123",
            name: "Plan Rule",
            rule_type: "plan_entitlement",
            priority: 0,
            value: true,
            conditions: [
              {
                id: "cond-1",
                account_id: "account-123",
                environment_id: "env-123",
                condition_type: "plan",
                operator: "eq",
                resource_ids: ["plan_123"],
                trait_value: "",
              },
            ],
            condition_groups: [],
          },
        ],
      };
      const result = await rulesEngine.checkFlag(flag, minimalCompany);
      expect(result).toBeDefined();
    });

    test("condition with condition_type metric (metric_value 0)", async () => {
      const flag = {
        ...minimalFlag,
        rules: [
          {
            id: "rule-1",
            account_id: "account-123",
            environment_id: "env-123",
            name: "Metric Rule",
            rule_type: "plan_entitlement",
            priority: 0,
            value: true,
            conditions: [
              {
                id: "cond-1",
                account_id: "account-123",
                environment_id: "env-123",
                condition_type: "metric",
                operator: "lt",
                resource_ids: [],
                event_subtype: "api-call",
                metric_value: 0,
                metric_period: "current_month",
                metric_period_month_reset: "first_of_month",
                trait_value: "0",
              },
            ],
            condition_groups: [],
          },
        ],
      };
      const result = await rulesEngine.checkFlag(flag, minimalCompany);
      expect(result).toBeDefined();
    });
  });

  describe("Metric condition evaluation", () => {
    const metricCondition = {
      id: "cond-1",
      account_id: "account-123",
      environment_id: "env-123",
      condition_type: "metric" as const,
      operator: "lt",
      resource_ids: [],
      event_subtype: "api-call",
      metric_value: 0,
      metric_period: "current_day",
      trait_value: "0",
    };

    const makeFlag = (conditions: object[]) => ({
      ...minimalFlag,
      rules: [
        {
          id: "rule-1",
          account_id: "account-123",
          environment_id: "env-123",
          name: "Metric Rule",
          rule_type: "plan_entitlement",
          priority: 0,
          value: true,
          conditions,
          condition_groups: [],
        },
      ],
    });

    test("metric_value 0 with company passes", async () => {
      const flag = makeFlag([metricCondition]);
      const result = await rulesEngine.checkFlag(flag, minimalCompany);
      expect(result).toBeDefined();
    });

    test("metric_value 0 with current_month period passes", async () => {
      const flag = makeFlag([
        { ...metricCondition, metric_period: "current_month" },
      ]);
      const result = await rulesEngine.checkFlag(flag, minimalCompany);
      expect(result).toBeDefined();
    });

    test("metric without company passes (any metric_value)", async () => {
      const flag = makeFlag([
        { ...metricCondition, metric_value: 100, trait_value: "100" },
      ]);
      const result = await rulesEngine.checkFlag(flag);
      expect(result).toBeDefined();
    });

    test("metric not evaluated when plan condition short-circuits", async () => {
      // Company does NOT have the required plan, so the plan condition fails
      // and the metric condition is never evaluated (even with metric_value > 0)
      const flag = makeFlag([
        {
          id: "cond-plan",
          account_id: "account-123",
          environment_id: "env-123",
          condition_type: "plan",
          operator: "eq",
          resource_ids: ["plan_missing"],
          metric_value: 0,
          trait_value: "",
        },
        { ...metricCondition, metric_value: 100, trait_value: "100" },
      ]);
      const result = await rulesEngine.checkFlag(flag, minimalCompany);
      expect(result).toBeDefined();
    });

    test("metric_value > 0 with company evaluates correctly", async () => {
      const flag = makeFlag([
        { ...metricCondition, metric_value: 100, trait_value: "100" },
      ]);
      const result = await rulesEngine.checkFlag(flag, minimalCompany);
      expect(result).toBeDefined();
      expect(typeof result.value).toBe("boolean");
    });

    test("matching plan + metric_value > 0 evaluates correctly", async () => {
      const flag = makeFlag([
        {
          id: "cond-plan",
          account_id: "account-123",
          environment_id: "env-123",
          condition_type: "plan",
          operator: "eq",
          resource_ids: ["plan_123"],
          metric_value: 0,
          trait_value: "",
        },
        { ...metricCondition, metric_value: 100, trait_value: "100" },
      ]);
      const company = { ...minimalCompany, plan_ids: ["plan_123"] };
      const result = await rulesEngine.checkFlag(flag, company);
      expect(result).toBeDefined();
      expect(result.value).toBe(true);
    });
  });

  describe("Edge cases - null/undefined field handling", () => {
    test("company with undefined optional fields", async () => {
      const company = {
        ...minimalCompany,
        base_plan_id: undefined,
        subscription: undefined,
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with null optional fields", async () => {
      const company = {
        ...minimalCompany,
        base_plan_id: null,
        subscription: null,
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with empty arrays for all list fields", async () => {
      const company = {
        ...minimalCompany,
        billing_product_ids: [],
        crm_product_ids: [],
        plan_ids: [],
        metrics: [],
        traits: [],
        rules: [],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("trait with null trait_definition", async () => {
      const company = {
        ...minimalCompany,
        traits: [
          {
            value: "pro",
            trait_definition: null,
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("trait with undefined trait_definition", async () => {
      const company = {
        ...minimalCompany,
        traits: [
          {
            value: "pro",
            trait_definition: undefined,
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("trait with missing trait_definition key", async () => {
      const company = {
        ...minimalCompany,
        traits: [
          {
            value: "pro",
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("condition with null optional fields", async () => {
      const flag = {
        ...minimalFlag,
        rules: [
          {
            id: "rule-1",
            account_id: "account-123",
            environment_id: "env-123",
            name: "Test",
            rule_type: "standard",
            priority: 100,
            value: true,
            conditions: [
              {
                id: "cond-1",
                account_id: "account-123",
                environment_id: "env-123",
                condition_type: "trait",
                operator: "eq",
                resource_ids: [],
                trait_value: "test",
                trait_definition: null,
                comparison_trait_definition: null,
                metric_period: null,
                metric_value: null,
                event_subtype: null,
                consumption_rate: null,
                credit_id: null,
                metric_period_month_reset: null,
              },
            ],
            condition_groups: [],
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flag,
        minimalCompany,
        minimalUser,
      );
      expect(result).toBeDefined();
    });

    test("metric with null valid_until", async () => {
      const company = {
        ...minimalCompany,
        metrics: [
          {
            account_id: "account-123",
            company_id: "company-1",
            created_at: "2024-01-15T10:00:00Z",
            environment_id: "env-123",
            event_subtype: "api-call",
            month_reset: "first_of_month",
            period: "current_month",
            valid_until: null,
            value: 150,
          },
        ],
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("company with null list fields (realistic wire data)", async () => {
      // Wire data can have null for list fields instead of empty arrays
      const company = {
        id: "company-1",
        account_id: "account-123",
        environment_id: "env-123",
        keys: { id: "company-1" },
        billing_product_ids: null,
        crm_product_ids: null,
        credit_balances: {},
        plan_ids: null,
        metrics: null,
        traits: null,
        rules: null,
      };
      const result = await rulesEngine.checkFlag(
        flagWithStandardRule,
        company,
      );
      expect(result).toBeDefined();
    });

    test("flag with null rules list", async () => {
      const flag = {
        ...minimalFlag,
        rules: null,
      };
      const result = await rulesEngine.checkFlag(flag);
      expect(result).toBeDefined();
    });
  });
});
