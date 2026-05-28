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
 * present in the partial object. Maps (keys, credit_balances) merge
 * additively. Metrics are upserted by (eventSubtype, period, monthReset).
 * All other fields replace the existing value. The original is not mutated.
 *
 * Partials don't carry refreshed entitlements, so when their derived fields
 * change in another part of the company we sync them here to match server
 * behavior:
 *   - credit_remaining ← credit_balances[credit_id]
 *   - usage ← metric value matching (event_name, metric_period, month_reset)
 * Both are skipped when the partial also sends entitlements wholesale.
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

    // The incoming credit balances (only the keys present in this partial), and
    // whether metrics were touched. Used below to re-derive entitlement fields.
    let updatedBalances: Record<string, number> | undefined;
    let metricsUpdated = false;

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
                const incomingCB = (partial[key] ?? {}) as Record<string, number>;
                merged[key] = { ...existingCB, ...incomingCB };
                updatedBalances = incomingCB;
                break;
            }
            case "metrics": {
                const existingMetrics = ((getProp(merged, "metrics", "metrics") as unknown[]) ??
                    []) as Schematic.RulesengineCompanyMetric[];
                const incomingMetrics = (partial[key] ?? []) as Schematic.RulesengineCompanyMetric[];
                merged[key] = upsertMetrics(existingMetrics, incomingMetrics);
                metricsUpdated = true;
                break;
            }
            // Ignore unknown keys silently
        }
    }

    if ((updatedBalances || metricsUpdated) && !("entitlements" in partial)) {
        syncEntitlementDerivedFields(merged, updatedBalances, metricsUpdated);
    }

    return merged as unknown as Schematic.RulesengineCompany;
}

/**
 * Re-derives entitlement fields whose source data changed in a partial that
 * did not itself carry fresh entitlements. Mutates the entitlement objects on
 * the already-deep-copied `merged` company in place:
 *   - credit_remaining ← the incoming balance for the entitlement's credit_id
 *   - usage ← the merged metric value matching (event_name, metric_period, month_reset),
 *     defaulting metric_period to "all_time" and month_reset to "first_of_month"
 */
function syncEntitlementDerivedFields(
    merged: Record<string, unknown>,
    updatedBalances: Record<string, number> | undefined,
    metricsUpdated: boolean,
): void {
    const entitlements = (getProp(merged, "entitlements", "entitlements") ?? []) as Record<string, unknown>[];
    if (entitlements.length === 0) {
        return;
    }

    // Build a value lookup from the merged metrics, keyed the same way as the
    // upsert so entitlements can find their matching usage.
    const metricsLookup = new Map<string, number>();
    if (metricsUpdated) {
        const mergedMetrics = (getProp(merged, "metrics", "metrics") ?? []) as Record<string, unknown>[];
        for (const m of mergedMetrics) {
            if (!m) continue;
            metricsLookup.set(metricKeyString(getMetricKey(m)), (m.value as number) ?? 0);
        }
    }

    for (const ent of entitlements) {
        const creditId = (ent.creditId ?? ent.credit_id) as string | undefined;
        if (updatedBalances && creditId && creditId in updatedBalances) {
            ent.credit_remaining = updatedBalances[creditId];
        }

        // Credit-attached entitlements are intentionally NOT skipped: usage here
        // reflects the raw event count for the entitlement's event, not credits used.
        const eventName = (ent.eventName ?? ent.event_name) as string | undefined;
        if (metricsLookup.size > 0 && eventName) {
            const period = ((ent.metricPeriod ?? ent.metric_period) as string) || "all_time";
            const monthReset = ((ent.monthReset ?? ent.month_reset) as string) || "first_of_month";
            const matched = metricsLookup.get(
                metricKeyString({ eventSubtype: eventName, period, monthReset }),
            );
            if (matched !== undefined) {
                ent.usage = matched;
            }
        }
    }
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
