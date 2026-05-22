import type * as Schematic from "../api/types";

export function deepCopyCompany(c: Schematic.RulesengineCompany): Schematic.RulesengineCompany {
    return JSON.parse(JSON.stringify(c));
}

export function deepCopyUser(u: Schematic.RulesengineUser): Schematic.RulesengineUser {
    return JSON.parse(JSON.stringify(u));
}

// Partial updates arrive as raw wire payloads (snake_case keys) and are merged
// into an existing camelCase-canonicalized entity. Each case writes the
// corresponding camelCase field so the cached entity stays in a single shape.
export function partialCompany(
    existing: Schematic.RulesengineCompany,
    partial: Record<string, unknown>,
): Schematic.RulesengineCompany {
    const merged = deepCopyCompany(existing) as unknown as Record<string, unknown>;

    for (const key of Object.keys(partial)) {
        switch (key) {
            case "id":
                merged.id = partial[key];
                break;
            case "account_id":
                merged.accountId = partial[key];
                break;
            case "environment_id":
                merged.environmentId = partial[key];
                break;
            case "base_plan_id":
                merged.basePlanId = partial[key] ?? null;
                break;
            case "billing_product_ids":
                merged.billingProductIds = partial[key];
                break;
            case "plan_ids":
                merged.planIds = partial[key];
                break;
            case "plan_version_ids":
                merged.planVersionIds = partial[key];
                break;
            case "entitlements":
                merged.entitlements = partial[key];
                break;
            case "rules":
                merged.rules = partial[key];
                break;
            case "traits":
                merged.traits = partial[key];
                break;
            case "subscription":
                merged.subscription = partial[key];
                break;
            case "keys": {
                const existingKeys = (merged.keys ?? {}) as Record<string, string>;
                const incomingKeys = partial[key] as Record<string, string>;
                merged.keys = { ...existingKeys, ...incomingKeys };
                break;
            }
            case "credit_balances": {
                const existingCB = (merged.creditBalances ?? {}) as Record<string, number>;
                const incomingCB = partial[key] as Record<string, number>;
                merged.creditBalances = { ...existingCB, ...incomingCB };
                break;
            }
            case "metrics": {
                const existingMetrics = (merged.metrics ?? []) as Schematic.RulesengineCompanyMetric[];
                const incomingMetrics = partial[key] as Schematic.RulesengineCompanyMetric[];
                merged.metrics = upsertMetrics(existingMetrics, incomingMetrics);
                break;
            }
            // Ignore unknown keys silently
        }
    }

    return merged as unknown as Schematic.RulesengineCompany;
}

export function partialUser(
    existing: Schematic.RulesengineUser,
    partial: Record<string, unknown>,
): Schematic.RulesengineUser {
    const merged = deepCopyUser(existing) as unknown as Record<string, unknown>;

    for (const key of Object.keys(partial)) {
        switch (key) {
            case "id":
                merged.id = partial[key];
                break;
            case "account_id":
                merged.accountId = partial[key];
                break;
            case "environment_id":
                merged.environmentId = partial[key];
                break;
            case "keys": {
                const existingKeys = (merged.keys ?? {}) as Record<string, string>;
                const incomingKeys = partial[key] as Record<string, string>;
                merged.keys = { ...existingKeys, ...incomingKeys };
                break;
            }
            case "traits":
                merged.traits = partial[key];
                break;
            case "rules":
                merged.rules = partial[key];
                break;
            // Ignore unknown keys silently
        }
    }

    return merged as unknown as Schematic.RulesengineUser;
}

/**
 * Metric key used for deduplication during upsert.
 */
interface MetricKey {
    eventSubtype: string;
    period: string;
    monthReset: string;
}

function metricKeyString(m: MetricKey): string {
    return `${m.eventSubtype}|${m.period}|${m.monthReset}`;
}

function getMetricKey(m: Record<string, unknown>): MetricKey {
    return {
        eventSubtype: ((m.eventSubtype ?? m.event_subtype) as string) || "",
        period: ((m.period as string) || ""),
        monthReset: ((m.monthReset ?? m.month_reset) as string) || "",
    };
}

/**
 * Merges incoming metrics into existing ones. Metrics are matched by
 * (eventSubtype, period, monthReset); matches are replaced, new metrics
 * are appended.
 */
function upsertMetrics(
    existing: Schematic.RulesengineCompanyMetric[],
    incoming: Schematic.RulesengineCompanyMetric[],
): Schematic.RulesengineCompanyMetric[] {
    const result = [...existing];
    const index = new Map<string, number>();

    for (let i = 0; i < result.length; i++) {
        const m = result[i];
        if (m) {
            const k = metricKeyString(getMetricKey(m as unknown as Record<string, unknown>));
            index.set(k, i);
        }
    }

    for (const m of incoming) {
        if (!m) continue;
        const k = metricKeyString(getMetricKey(m as unknown as Record<string, unknown>));
        const idx = index.get(k);
        if (idx !== undefined) {
            result[idx] = m;
        } else {
            result.push(m);
        }
    }

    return result;
}
