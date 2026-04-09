import type * as Schematic from "../api/types";

/**
 * Helper to read a property that may be in camelCase or snake_case form.
 * Wire data from WebSocket uses snake_case; Fern-generated types use camelCase.
 */
function getProp(obj: Record<string, unknown>, camel: string, snake: string): unknown {
    return obj[camel] ?? obj[snake];
}

/**
 * Creates a complete deep copy of a Company object.
 */
export function deepCopyCompany(c: Schematic.RulesengineCompany): Schematic.RulesengineCompany {
    return JSON.parse(JSON.stringify(c));
}

/**
 * Creates a complete deep copy of a User object.
 */
export function deepCopyUser(u: Schematic.RulesengineUser): Schematic.RulesengineUser {
    return JSON.parse(JSON.stringify(u));
}

/**
 * Merges a partial update into an existing Company.
 * Deep-copies the existing company, then applies only the fields
 * present in the partial object.
 *
 * Wire format uses snake_case keys. The existing company from cache
 * may have either camelCase or snake_case keys depending on how it
 * was stored.
 */
export function partialCompany(
    existing: Schematic.RulesengineCompany,
    partial: Record<string, unknown>,
): Schematic.RulesengineCompany {
    const merged = deepCopyCompany(existing) as unknown as Record<string, unknown>;

    for (const key of Object.keys(partial)) {
        switch (key) {
            case "id":
            case "account_id":
            case "environment_id":
                merged[key] = partial[key];
                break;
            case "base_plan_id":
                merged[key] = partial[key] ?? null;
                break;
            case "billing_product_ids":
            case "plan_ids":
            case "plan_version_ids":
            case "entitlements":
            case "rules":
            case "traits":
            case "subscription":
                merged[key] = partial[key];
                break;
            case "keys": {
                const existingKeys = (getProp(merged, "keys", "keys") ?? {}) as Record<string, string>;
                const incomingKeys = partial[key] as Record<string, string>;
                merged[key] = { ...existingKeys, ...incomingKeys };
                break;
            }
            case "credit_balances": {
                const existingCB = (getProp(merged, "creditBalances", "credit_balances") ?? {}) as Record<
                    string,
                    number
                >;
                const incomingCB = partial[key] as Record<string, number>;
                merged[key] = { ...existingCB, ...incomingCB };
                break;
            }
            case "metrics": {
                const existingMetrics = ((getProp(merged, "metrics", "metrics") as unknown[]) ??
                    []) as Schematic.RulesengineCompanyMetric[];
                const incomingMetrics = partial[key] as Schematic.RulesengineCompanyMetric[];
                merged[key] = upsertMetrics(existingMetrics, incomingMetrics);
                break;
            }
            // Ignore unknown keys silently
        }
    }

    return merged as unknown as Schematic.RulesengineCompany;
}

/**
 * Merges a partial update into an existing User.
 * Deep-copies the existing user, then applies only the fields
 * present in the partial object.
 */
export function partialUser(
    existing: Schematic.RulesengineUser,
    partial: Record<string, unknown>,
): Schematic.RulesengineUser {
    const merged = deepCopyUser(existing) as unknown as Record<string, unknown>;

    for (const key of Object.keys(partial)) {
        switch (key) {
            case "id":
            case "account_id":
            case "environment_id":
                merged[key] = partial[key];
                break;
            case "keys": {
                const existingKeys = (getProp(merged, "keys", "keys") ?? {}) as Record<string, string>;
                const incomingKeys = partial[key] as Record<string, string>;
                merged[key] = { ...existingKeys, ...incomingKeys };
                break;
            }
            case "traits":
            case "rules":
                merged[key] = partial[key];
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
