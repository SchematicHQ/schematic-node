import * as Schematic from '../../../src/api/types';
import {
    partialCompany,
    partialUser,
    deepCopyCompany,
    deepCopyUser,
} from '../../../src/datastream/merge';

// Helper: base company in snake_case wire format (matches WebSocket data)
function baseCompany(): Schematic.RulesengineCompany {
    return {
        id: 'co-1',
        account_id: 'acc-1',
        environment_id: 'env-1',
        base_plan_id: 'plan-1',
        billing_product_ids: ['bp-1'],
        credit_balances: { 'credit-1': 100.0 },
        keys: { domain: 'example.com' },
        plan_ids: ['plan-1'],
        plan_version_ids: ['pv-1'],
        traits: [
            { value: 'Enterprise', trait_definition: { id: 'plan', comparable_type: 'string', entity_type: 'company' } },
        ],
        entitlements: [
            { feature_id: 'feat-1', feature_key: 'feature-one', value_type: 'boolean' },
        ],
        metrics: [],
        rules: [],
    } as unknown as Schematic.RulesengineCompany;
}

function baseUser(): Schematic.RulesengineUser {
    return {
        id: 'user-1',
        account_id: 'acc-1',
        environment_id: 'env-1',
        keys: { email: 'user@example.com' },
        traits: [
            { value: 'Premium', trait_definition: { id: 'tier', comparable_type: 'string', entity_type: 'user' } },
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
        expect(m.account_id).toBe('acc-1');
        expect(m.environment_id).toBe('env-1');
        expect(m.keys).toEqual({ domain: 'example.com' });
        expect(m.billing_product_ids).toEqual(['bp-1']);
        expect(m.base_plan_id).toBe('plan-1');
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

        expect(m.credit_balances).toEqual({ 'credit-1': 100.0, 'credit-2': 200.0 });
    });

    test('overwrites credit balance', () => {
        const existing = baseCompany();
        const partial = { id: 'co-1', credit_balances: { 'credit-1': 50.0 } };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.credit_balances).toEqual({ 'credit-1': 50.0 });
    });

    test('upserts metrics - updates existing, appends new', () => {
        const existing = baseCompany();
        (existing as unknown as Record<string, unknown>).metrics = [
            {
                account_id: 'acc-1', environment_id: 'env-1', company_id: 'co-1',
                event_subtype: 'event-a', period: 'all_time', month_reset: 'first_of_month',
                value: 10, created_at: '2026-01-01T00:00:00Z',
            },
            {
                account_id: 'acc-1', environment_id: 'env-1', company_id: 'co-1',
                event_subtype: 'event-b', period: 'current_month', month_reset: 'first_of_month',
                value: 5, created_at: '2026-01-01T00:00:00Z',
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
        // event-a updated in place
        expect(metrics[0].event_subtype).toBe('event-a');
        expect(metrics[0].value).toBe(42);
        // event-b unchanged
        expect(metrics[1].event_subtype).toBe('event-b');
        expect(metrics[1].value).toBe(5);
        // event-c appended
        expect(metrics[2].event_subtype).toBe('event-c');
        expect(metrics[2].value).toBe(1);

        // Original not mutated
        const origMetrics = (existing as unknown as Record<string, unknown>).metrics as Record<string, unknown>[];
        expect(origMetrics[0].value).toBe(10);
    });

    test('empty entitlements clears existing', () => {
        const existing = baseCompany();
        const partial = { id: 'co-1', entitlements: [] };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.entitlements).toEqual([]);
        expect(m.account_id).toBe('acc-1');
    });

    test('null base_plan_id sets to null', () => {
        const existing = baseCompany();
        const partial = { id: 'co-1', base_plan_id: null };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.base_plan_id).toBeNull();
        expect(m.billing_product_ids).toEqual(['bp-1']);
    });

    test('tolerates missing id - cache lookup uses envelope entity_id', () => {
        const existing = baseCompany();
        // Wire shape from the API: data is wrapped under the field name,
        // no id at the top level. The cache lookup happens at the handler
        // level using envelope.entity_id, not from the data payload.
        const partial = { credit_balances: { 'credit-2': 200.0 } };

        const merged = partialCompany(existing, partial);
        const m = merged as unknown as Record<string, unknown>;

        expect(m.credit_balances).toEqual({ 'credit-1': 100.0, 'credit-2': 200.0 });
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
                account_id: 'acc-1', environment_id: 'env-1', company_id: 'co-1',
                event_subtype: 'event-a', period: 'all_time', month_reset: 'first_of_month',
                value: 10, created_at: '2026-01-01T00:00:00Z',
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
        expect(m.account_id).toBe('acc-2');
        expect(m.environment_id).toBe('env-2');
        expect(m.base_plan_id).toBe('plan-99');
        expect(m.billing_product_ids).toEqual(['bp-10', 'bp-20']);

        // Credit balances merge: credit-1 overwritten, credit-new added
        expect(m.credit_balances).toEqual({ 'credit-1': 999.0, 'credit-new': 50.0 });

        const entitlements = m.entitlements as Record<string, unknown>[];
        expect(entitlements.length).toBe(2);
        expect(entitlements[0].feature_id).toBe('feat-new');
        expect(entitlements[1].feature_id).toBe('feat-2');

        // Keys merge: domain overwritten, slug added
        expect(m.keys).toEqual({ domain: 'new.com', slug: 'new-slug' });

        // Metrics upsert: event-a updated, event-new appended
        const metrics = m.metrics as Record<string, unknown>[];
        expect(metrics.length).toBe(2);
        expect(metrics[0].event_subtype).toBe('event-a');
        expect(metrics[0].value).toBe(42);
        expect(metrics[1].event_subtype).toBe('event-new');
        expect(metrics[1].value).toBe(7);

        expect(m.plan_ids).toEqual(['plan-99', 'plan-100']);
        expect(m.plan_version_ids).toEqual(['pv-99']);

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
        expect(orig.account_id).toBe('acc-1');
        expect(orig.base_plan_id).toBe('plan-1');
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
                account_id: 'acc-1', environment_id: 'env-1', company_id: 'co-1',
                event_subtype: 'event-1', period: 'all_time', month_reset: 'first_of_month',
                value: 42, created_at: '2026-01-01T00:00:00Z',
            },
        ];
        origRaw.subscription = { id: 'sub-1', period_start: '2026-01-01T00:00:00Z', period_end: '2027-01-01T00:00:00Z' };

        const cp = deepCopyCompany(orig);
        const cpRaw = cp as unknown as Record<string, unknown>;

        // Keys are independent
        (cpRaw.keys as Record<string, string>).domain = 'changed.com';
        expect((origRaw.keys as Record<string, string>).domain).toBe('example.com');

        // Credit balances are independent
        (cpRaw.credit_balances as Record<string, number>)['credit-1'] = 999;
        expect((origRaw.credit_balances as Record<string, number>)['credit-1']).toBe(100.0);

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
            account_id: 'acc-1',
            environment_id: 'env-1',
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
