import * as Schematic from '../../../src/api/types';
import {
    partialCompany,
    partialUser,
    deepCopyCompany,
    deepCopyUser,
} from '../../../src/datastream/merge';

// Helper: base company in camelCase (matches the cached, parseOrThrow-normalized
// shape that partialCompany sees in production). Partial payloads arrive in
// snake_case from the wire; the merge function canonicalizes to camelCase.
function baseCompany(): Schematic.RulesengineCompany {
    return {
        id: 'co-1',
        accountId: 'acc-1',
        environmentId: 'env-1',
        basePlanId: 'plan-1',
        billingProductIds: ['bp-1'],
        creditBalances: { 'credit-1': 100.0 },
        keys: { domain: 'example.com' },
        planIds: ['plan-1'],
        planVersionIds: ['pv-1'],
        traits: [
            { value: 'Enterprise', traitDefinition: { id: 'plan', comparableType: 'string', entityType: 'company' } },
        ],
        entitlements: [
            { featureId: 'feat-1', featureKey: 'feature-one', valueType: 'boolean' },
        ],
        metrics: [],
        rules: [],
    } as unknown as Schematic.RulesengineCompany;
}

function baseUser(): Schematic.RulesengineUser {
    return {
        id: 'user-1',
        accountId: 'acc-1',
        environmentId: 'env-1',
        keys: { email: 'user@example.com' },
        traits: [
            { value: 'Premium', traitDefinition: { id: 'tier', comparableType: 'string', entityType: 'user' } },
        ],
        rules: [],
    } as unknown as Schematic.RulesengineUser;
}

function makeRule(id: string): Record<string, unknown> {
    return {
        id,
        account_id: 'acc-1',
        environment_id: 'env-1',
        name: id,
        priority: 1,
        rule_type: 'default',
        value: true,
        conditions: [],
        condition_groups: [],
    };
}

// --- partialCompany tests ---

describe('partialCompany', () => {
    test('only traits - replaces traits, preserves other fields', () => {
        const existing = baseCompany();
        const partial = {
            id: 'co-1',
            traits: [{ value: 'Startup', trait_definition: { id: 'plan', comparable_type: 'string', entity_type: 'company' } }],
        };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect((m.traits as unknown[]).length).toBe(1);
        expect((m.traits as Record<string, unknown>[])[0].value).toBe('Startup');

        // Other fields preserved
        expect(m.accountId).toBe('acc-1');
        expect(m.environmentId).toBe('env-1');
        expect(m.keys).toEqual({ domain: 'example.com' });
        expect(m.billingProductIds).toEqual(['bp-1']);
        expect(m.basePlanId).toBe('plan-1');
    });

    test('merges keys - new key added, existing preserved', () => {
        const existing = baseCompany();
        const partial = { id: 'co-1', keys: { slug: 'new-slug' } };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.keys).toEqual({ domain: 'example.com', slug: 'new-slug' });
        expect((m.traits as unknown[]).length).toBe(1);
    });

    test('merges credit_balances - new balance added, existing preserved', () => {
        const existing = baseCompany();
        const partial = { id: 'co-1', credit_balances: { 'credit-2': 200.0 } };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.creditBalances).toEqual({ 'credit-1': 100.0, 'credit-2': 200.0 });
    });

    test('overwrites credit balance', () => {
        const existing = baseCompany();
        const partial = { id: 'co-1', credit_balances: { 'credit-1': 50.0 } };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.creditBalances).toEqual({ 'credit-1': 50.0 });
    });

    test('upserts metrics - updates existing, appends new', () => {
        const existing = baseCompany();
        // Cached metrics are camelCase (canonicalized by parseOrThrow on ingest).
        (existing as unknown as Record<string, unknown>).metrics = [
            {
                accountId: 'acc-1', environmentId: 'env-1', companyId: 'co-1',
                eventSubtype: 'event-a', period: 'all_time', monthReset: 'first_of_month',
                value: 10, createdAt: '2026-01-01T00:00:00Z',
            },
            {
                accountId: 'acc-1', environmentId: 'env-1', companyId: 'co-1',
                eventSubtype: 'event-b', period: 'current_month', monthReset: 'first_of_month',
                value: 5, createdAt: '2026-01-01T00:00:00Z',
            },
        ];

        const partial = {
            id: 'co-1',
            metrics: [
                {
                    account_id: 'acc-1', environment_id: 'env-1', company_id: 'co-1',
                    event_subtype: 'event-a', period: 'all_time', month_reset: 'first_of_month',
                    value: 42, created_at: '2026-01-01T00:00:00Z',
                },
                {
                    account_id: 'acc-1', environment_id: 'env-1', company_id: 'co-1',
                    event_subtype: 'event-c', period: 'current_day', month_reset: 'billing_cycle',
                    value: 1, created_at: '2026-01-01T00:00:00Z',
                },
            ],
        };

        const merged = partialCompany(existing, partial);
        const metrics = (merged as unknown as Record<string, unknown>).metrics as Record<string, unknown>[];

        expect(metrics.length).toBe(3);
        // event-a updated in place; incoming wire metric canonicalized to camelCase
        expect(metrics[0].eventSubtype).toBe('event-a');
        expect(metrics[0].event_subtype).toBeUndefined();
        expect(metrics[0].value).toBe(42);
        // event-b unchanged
        expect(metrics[1].eventSubtype).toBe('event-b');
        expect(metrics[1].value).toBe(5);
        // event-c appended (canonicalized)
        expect(metrics[2].eventSubtype).toBe('event-c');
        expect(metrics[2].value).toBe(1);

        // Original not mutated
        const origMetrics = (existing as unknown as Record<string, unknown>).metrics as Record<string, unknown>[];
        expect(origMetrics[0].value).toBe(10);
    });

    test('credit_balances update re-derives entitlement creditRemaining', () => {
        const existing = baseCompany();
        // Cached entitlements are camelCase (canonicalized by parseOrThrow on ingest).
        (existing as unknown as Record<string, unknown>).entitlements = [
            { featureId: 'feat-1', featureKey: 'feature-one', valueType: 'credit', creditId: 'credit-1', creditRemaining: 100.0 },
            { featureId: 'feat-2', featureKey: 'feature-two', valueType: 'credit', creditId: 'credit-2', creditRemaining: 0 },
            { featureId: 'feat-3', featureKey: 'feature-three', valueType: 'boolean' },
        ];

        // Partial only updates one of the credit balances and carries no entitlements.
        const partial = { id: 'co-1', credit_balances: { 'credit-1': 42.0 } };

        const merged = partialCompany(existing, partial);
        const ents = (merged as unknown as Record<string, unknown>).entitlements as Record<string, unknown>[];

        // credit-1 entitlement re-derived from incoming balance
        expect(ents[0].creditRemaining).toBe(42.0);
        // Regression: the sync must not leave a snake_case twin next to the
        // camelCase field — the WASM engine rejects objects carrying both
        // casings of the same field ("duplicate field creditRemaining").
        expect(ents[0].credit_remaining).toBeUndefined();
        // credit-2 was not in the partial, left untouched
        expect(ents[1].creditRemaining).toBe(0);
        // non-credit entitlement untouched
        expect(ents[2].creditRemaining).toBeUndefined();

        // Original not mutated
        const origEnts = (existing as unknown as Record<string, unknown>).entitlements as Record<string, unknown>[];
        expect(origEnts[0].creditRemaining).toBe(100.0);
    });

    test('credit_lease_balance applies remaining (ignoring reserved) and re-derives entitlement creditRemaining', () => {
        const existing = baseCompany();
        (existing as unknown as Record<string, unknown>).entitlements = [
            { featureId: 'feat-1', featureKey: 'feature-one', valueType: 'credit', creditId: 'credit-1', creditRemaining: 100.0 },
            { featureId: 'feat-2', featureKey: 'feature-two', valueType: 'credit', creditId: 'credit-2', creditRemaining: 0 },
        ];

        // Atomic lease-balance partial: remaining + reserved for credit-1, no entitlements.
        const partial = { id: 'co-1', credit_lease_balance: { 'credit-1': { remaining: 42.0, reserved: 58.0 } } };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        // Company-level balance updated to remaining; reserved is ignored.
        expect(m.creditBalances).toEqual({ 'credit-1': 42.0 });

        const ents = m.entitlements as Record<string, unknown>[];
        // credit-1 entitlement re-derived from incoming remaining
        expect(ents[0].creditRemaining).toBe(42.0);
        expect(ents[0].credit_remaining).toBeUndefined();
        // credit-2 not in the partial, left untouched
        expect(ents[1].creditRemaining).toBe(0);

        // Original not mutated
        const origEnts = (existing as unknown as Record<string, unknown>).entitlements as Record<string, unknown>[];
        expect(origEnts[0].creditRemaining).toBe(100.0);
    });

    test('metrics update re-derives entitlement usage', () => {
        const existing = baseCompany();
        (existing as unknown as Record<string, unknown>).metrics = [
            {
                accountId: 'acc-1', environmentId: 'env-1', companyId: 'co-1',
                eventSubtype: 'api-calls', period: 'current_month', monthReset: 'first_of_month',
                value: 10, createdAt: '2026-01-01T00:00:00Z',
            },
        ];
        (existing as unknown as Record<string, unknown>).entitlements = [
            { featureId: 'feat-1', featureKey: 'feature-one', valueType: 'numeric', eventName: 'api-calls', metricPeriod: 'current_month', monthReset: 'first_of_month', usage: 10 },
            { featureId: 'feat-2', featureKey: 'feature-two', valueType: 'numeric', eventName: 'other-event', metricPeriod: 'current_month', monthReset: 'first_of_month', usage: 3 },
        ];

        // Partial upserts the api-calls metric and carries no entitlements.
        const partial = {
            id: 'co-1',
            metrics: [
                {
                    account_id: 'acc-1', environment_id: 'env-1', company_id: 'co-1',
                    event_subtype: 'api-calls', period: 'current_month', month_reset: 'first_of_month',
                    value: 99, created_at: '2026-01-02T00:00:00Z',
                },
            ],
        };

        const merged = partialCompany(existing, partial);
        const ents = (merged as unknown as Record<string, unknown>).entitlements as Record<string, unknown>[];

        // matching entitlement usage synced to the merged metric value
        expect(ents[0].usage).toBe(99);
        // entitlement with no matching metric is unchanged
        expect(ents[1].usage).toBe(3);
    });

    test('metrics update applies metric_period/month_reset defaults when entitlement omits them', () => {
        const existing = baseCompany();
        (existing as unknown as Record<string, unknown>).metrics = [];
        (existing as unknown as Record<string, unknown>).entitlements = [
            // No metricPeriod / monthReset → should default to all_time / first_of_month
            { featureId: 'feat-1', featureKey: 'feature-one', valueType: 'numeric', eventName: 'logins', usage: 0 },
        ];

        const partial = {
            id: 'co-1',
            metrics: [
                {
                    account_id: 'acc-1', environment_id: 'env-1', company_id: 'co-1',
                    event_subtype: 'logins', period: 'all_time', month_reset: 'first_of_month',
                    value: 7, created_at: '2026-01-02T00:00:00Z',
                },
            ],
        };

        const merged = partialCompany(existing, partial);
        const ents = (merged as unknown as Record<string, unknown>).entitlements as Record<string, unknown>[];

        expect(ents[0].usage).toBe(7);
    });

    test('does not re-derive when partial carries entitlements wholesale', () => {
        const existing = baseCompany();
        (existing as unknown as Record<string, unknown>).entitlements = [
            { featureId: 'feat-1', featureKey: 'feature-one', valueType: 'credit', creditId: 'credit-1', creditRemaining: 100.0 },
        ];

        // Partial includes BOTH credit_balances and entitlements; the supplied
        // entitlements win and the derived sync is skipped entirely.
        // Partial payloads arrive in wire format (snake_case).
        const partial = {
            id: 'co-1',
            credit_balances: { 'credit-1': 42.0 },
            entitlements: [
                { feature_id: 'feat-1', feature_key: 'feature-one', value_type: 'credit', credit_id: 'credit-1', credit_remaining: 7.0 },
            ],
        };

        const merged = partialCompany(existing, partial);
        const ents = (merged as unknown as Record<string, unknown>).entitlements as Record<string, unknown>[];

        // Uses the entitlement value from the partial, NOT the balance-derived 42.
        // Incoming wire entitlements are canonicalized to camelCase on merge.
        expect(ents[0].creditRemaining).toBe(7.0);
        expect(ents[0].credit_remaining).toBeUndefined();
    });

    test('empty entitlements clears existing', () => {
        const existing = baseCompany();
        const partial = { id: 'co-1', entitlements: [] };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.entitlements).toEqual([]);
        expect(m.accountId).toBe('acc-1');
    });

    test('null base_plan_id sets to null', () => {
        const existing = baseCompany();
        const partial = { id: 'co-1', base_plan_id: null };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.basePlanId).toBeNull();
        expect(m.billingProductIds).toEqual(['bp-1']);
    });

    test('tolerates missing id - cache lookup uses envelope entity_id', () => {
        const existing = baseCompany();
        // Wire shape from the API: data is wrapped under the field name,
        // no id at the top level. The cache lookup happens at the handler
        // level using envelope.entity_id, not from the data payload.
        const partial = { credit_balances: { 'credit-2': 200.0 } };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.creditBalances).toEqual({ 'credit-1': 100.0, 'credit-2': 200.0 });
        expect(m.id).toBe('co-1');
    });

    test('does not mutate original', () => {
        const existing = baseCompany();
        const origKeys = { ...(existing as unknown as Record<string, unknown>).keys as Record<string, string> };

        const partial = { id: 'co-1', keys: { slug: 'new-slug' }, traits: [] };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect((existing as unknown as Record<string, unknown>).keys).toEqual(origKeys);
        expect(((existing as unknown as Record<string, unknown>).traits as unknown[]).length).toBe(1);

        expect(m.keys).toEqual({ domain: 'example.com', slug: 'new-slug' });
        expect((m.traits as unknown[]).length).toBe(0);
    });

    test('rules - replaces rules, original unchanged', () => {
        const existing = baseCompany();
        (existing as unknown as Record<string, unknown>).rules = [makeRule('rule-old')];

        const partial = { id: 'co-1', rules: [makeRule('rule-new')] };

        const merged = partialCompany(existing, partial);
        const mergedRules = (merged as unknown as Record<string, unknown>).rules as Record<string, unknown>[];
        const origRules = (existing as unknown as Record<string, unknown>).rules as Record<string, unknown>[];

        expect(mergedRules.length).toBe(1);
        expect(mergedRules[0].id).toBe('rule-new');
        expect(origRules[0].id).toBe('rule-old');
    });

    test('full entity partial message - all fields updated', () => {
        const existing = baseCompany();
        (existing as unknown as Record<string, unknown>).metrics = [
            {
                accountId: 'acc-1', environmentId: 'env-1', companyId: 'co-1',
                eventSubtype: 'event-a', period: 'all_time', monthReset: 'first_of_month',
                value: 10, createdAt: '2026-01-01T00:00:00Z',
            },
        ];
        (existing as unknown as Record<string, unknown>).rules = [makeRule('rule-1')];

        const partial = {
            id: 'co-1',
            account_id: 'acc-2',
            environment_id: 'env-2',
            base_plan_id: 'plan-99',
            billing_product_ids: ['bp-10', 'bp-20'],
            credit_balances: { 'credit-1': 999.0, 'credit-new': 50.0 },
            entitlements: [
                { feature_id: 'feat-new', feature_key: 'feature-new', value_type: 'boolean' },
                { feature_id: 'feat-2', feature_key: 'feature-two', value_type: 'boolean' },
            ],
            keys: { domain: 'new.com', slug: 'new-slug' },
            metrics: [
                {
                    account_id: 'acc-1', environment_id: 'env-1', company_id: 'co-1',
                    event_subtype: 'event-a', period: 'all_time', month_reset: 'first_of_month',
                    value: 42, created_at: '2026-01-01T00:00:00Z',
                },
                {
                    account_id: 'acc-1', environment_id: 'env-1', company_id: 'co-1',
                    event_subtype: 'event-new', period: 'current_day', month_reset: 'billing_cycle',
                    value: 7, created_at: '2026-01-01T00:00:00Z',
                },
            ],
            plan_ids: ['plan-99', 'plan-100'],
            plan_version_ids: ['pv-99'],
            rules: [makeRule('rule-new-1'), makeRule('rule-new-2')],
            subscription: { id: 'sub-new', period_start: '2026-01-01T00:00:00Z', period_end: '2027-01-01T00:00:00Z' },
            traits: [
                { value: 'Startup', trait_definition: { id: 'tier', comparable_type: 'string', entity_type: 'company' } },
                { value: 'Annual', trait_definition: { id: 'billing', comparable_type: 'string', entity_type: 'company' } },
            ],
        };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.id).toBe('co-1');
        expect(m.accountId).toBe('acc-2');
        expect(m.environmentId).toBe('env-2');
        expect(m.basePlanId).toBe('plan-99');
        expect(m.billingProductIds).toEqual(['bp-10', 'bp-20']);

        // Credit balances merge: credit-1 overwritten, credit-new added
        expect(m.creditBalances).toEqual({ 'credit-1': 999.0, 'credit-new': 50.0 });

        // Incoming wire entitlements are canonicalized to camelCase on merge
        const entitlements = m.entitlements as Record<string, unknown>[];
        expect(entitlements.length).toBe(2);
        expect(entitlements[0].featureId).toBe('feat-new');
        expect(entitlements[1].featureId).toBe('feat-2');

        // Keys merge: domain overwritten, slug added
        expect(m.keys).toEqual({ domain: 'new.com', slug: 'new-slug' });

        // Metrics upsert: event-a updated, event-new appended (canonicalized)
        const metrics = m.metrics as Record<string, unknown>[];
        expect(metrics.length).toBe(2);
        expect(metrics[0].eventSubtype).toBe('event-a');
        expect(metrics[0].value).toBe(42);
        expect(metrics[1].eventSubtype).toBe('event-new');
        expect(metrics[1].value).toBe(7);

        expect(m.planIds).toEqual(['plan-99', 'plan-100']);
        expect(m.planVersionIds).toEqual(['pv-99']);

        const rules = m.rules as Record<string, unknown>[];
        expect(rules.length).toBe(2);
        expect(rules[0].id).toBe('rule-new-1');
        expect(rules[1].id).toBe('rule-new-2');

        expect((m.subscription as Record<string, unknown>).id).toBe('sub-new');

        const traits = m.traits as Record<string, unknown>[];
        expect(traits.length).toBe(2);
        expect(traits[0].value).toBe('Startup');
        expect(traits[1].value).toBe('Annual');

        // Original not mutated
        const orig = existing as unknown as Record<string, unknown>;
        expect(orig.accountId).toBe('acc-1');
        expect(orig.basePlanId).toBe('plan-1');
        expect(orig.keys).toEqual({ domain: 'example.com' });
        expect((orig.metrics as Record<string, unknown>[])[0].value).toBe(10);
    });
});

// --- partialUser tests ---

describe('partialUser', () => {
    test('only traits - replaces traits, preserves keys', () => {
        const existing = baseUser();
        const partial = {
            traits: [{ value: 'Free', trait_definition: { id: 'tier', comparable_type: 'string', entity_type: 'user' } }],
        };

        const merged = partialUser(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect((m.traits as Record<string, unknown>[]).length).toBe(1);
        expect((m.traits as Record<string, unknown>[])[0].value).toBe('Free');
        expect(m.keys).toEqual({ email: 'user@example.com' });
    });

    test('merges keys - new key added, existing preserved', () => {
        const existing = baseUser();
        const partial = { keys: { slack_id: 'U123' } };

        const merged = partialUser(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.keys).toEqual({ email: 'user@example.com', slack_id: 'U123' });
        expect((m.traits as unknown[]).length).toBe(1);
    });

    test('tolerates missing id - cache lookup uses envelope entity_id', () => {
        const existing = baseUser();
        const partial = { keys: { email: 'new@example.com' } };

        const merged = partialUser(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.keys).toEqual({ email: 'new@example.com' });
        expect(m.id).toBe('user-1');
    });

    test('does not mutate original', () => {
        const existing = baseUser();
        const origKeys = { ...(existing as unknown as Record<string, unknown>).keys as Record<string, string> };

        const partial = { keys: { slug: 'new' }, traits: [] };

        const merged = partialUser(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect((existing as unknown as Record<string, unknown>).keys).toEqual(origKeys);
        expect(((existing as unknown as Record<string, unknown>).traits as unknown[]).length).toBe(1);

        expect(m.keys).toEqual({ email: 'user@example.com', slug: 'new' });
        expect((m.traits as unknown[]).length).toBe(0);
    });

    test('multiple fields in one payload', () => {
        const existing = baseUser();
        (existing as unknown as Record<string, unknown>).rules = [makeRule('rule-1')];

        const partial = {
            keys: { email: 'new@example.com', slack_id: 'U999' },
            traits: [
                { value: 'Free', trait_definition: { id: 'tier', comparable_type: 'string', entity_type: 'user' } },
            ],
            rules: [makeRule('rule-new-1')],
        };

        const merged = partialUser(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        // Keys merge: email overwritten, slack_id added
        expect(m.keys).toEqual({ email: 'new@example.com', slack_id: 'U999' });

        const traits = m.traits as Record<string, unknown>[];
        expect(traits.length).toBe(1);
        expect(traits[0].value).toBe('Free');

        const rules = m.rules as Record<string, unknown>[];
        expect(rules.length).toBe(1);
        expect(rules[0].id).toBe('rule-new-1');

        // Original not mutated
        const orig = existing as unknown as Record<string, unknown>;
        expect(orig.keys).toEqual({ email: 'user@example.com' });
        expect((orig.traits as unknown[]).length).toBe(1);
        expect((orig.rules as Record<string, unknown>[])[0].id).toBe('rule-1');
    });
});

// --- deepCopyCompany tests ---

describe('deepCopyCompany', () => {
    test('full copy - all nested structures independent', () => {
        const orig = baseCompany();
        const origRaw = orig as unknown as Record<string, unknown>;
        origRaw.metrics = [
            {
                accountId: 'acc-1', environmentId: 'env-1', companyId: 'co-1',
                eventSubtype: 'event-1', period: 'all_time', monthReset: 'first_of_month',
                value: 42, createdAt: '2026-01-01T00:00:00Z',
            },
        ];
        origRaw.subscription = { id: 'sub-1', periodStart: '2026-01-01T00:00:00Z', periodEnd: '2027-01-01T00:00:00Z' };

        const cp = deepCopyCompany(orig);
        const cpRaw = cp as unknown as Record<string, unknown>;

        // Keys are independent
        (cpRaw.keys as Record<string, string>).domain = 'changed.com';
        expect((origRaw.keys as Record<string, string>).domain).toBe('example.com');

        // Credit balances are independent
        (cpRaw.creditBalances as Record<string, number>)['credit-1'] = 999;
        expect((origRaw.creditBalances as Record<string, number>)['credit-1']).toBe(100.0);

        // Metrics are independent
        ((cpRaw.metrics as Record<string, unknown>[])[0]).value = 999;
        expect(((origRaw.metrics as Record<string, unknown>[])[0]).value).toBe(42);

        // Subscription is independent
        (cpRaw.subscription as Record<string, unknown>).id = 'changed';
        expect((origRaw.subscription as Record<string, unknown>).id).toBe('sub-1');

        // Traits are independent
        ((cpRaw.traits as Record<string, unknown>[])[0]).value = 'changed';
        expect(((origRaw.traits as Record<string, unknown>[])[0]).value).toBe('Enterprise');
    });
});

// --- deepCopyUser tests ---

describe('deepCopyUser', () => {
    test('empty fields - user with only required fields', () => {
        const cp = deepCopyUser({
            id: 'u1',
            accountId: 'acc-1',
            environmentId: 'env-1',
            keys: {},
            traits: [],
            rules: [],
        } as unknown as Schematic.RulesengineUser);
        const cpRaw = cp as unknown as Record<string, unknown>;

        expect(cpRaw.id).toBe('u1');
        expect(cpRaw.keys).toEqual({});
        expect(cpRaw.traits).toEqual([]);
        expect(cpRaw.rules).toEqual([]);
    });

    test('full copy - all fields independent', () => {
        const orig = baseUser();
        const origRaw = orig as unknown as Record<string, unknown>;
        origRaw.rules = [makeRule('r1')];

        const cp = deepCopyUser(orig);
        const cpRaw = cp as unknown as Record<string, unknown>;

        (cpRaw.keys as Record<string, string>).email = 'changed';
        expect((origRaw.keys as Record<string, string>).email).toBe('user@example.com');

        (cpRaw.traits as Record<string, unknown>[])[0] = { value: 'Free' };
        expect(((origRaw.traits as Record<string, unknown>[])[0]).value).toBe('Premium');

        (cpRaw.rules as Record<string, unknown>[])[0] = makeRule('r2');
        expect(((origRaw.rules as Record<string, unknown>[])[0]).id).toBe('r1');
    });
});
