import type * as Schematic from "../api/types";
import type { Schema } from "../core/schemas";
import * as serializers from "../serialization";

const PARSE_OPTS = { unrecognizedObjectKeys: "passthrough" as const };

/**
 * Canonicalizes a raw wire object (snake_case) to camelCase via its Fern
 * serializer, falling back to the raw object if parsing fails. Used on nested
 * objects arriving in partial payloads so the merged entity keeps a single
 * shape — the WASM rules engine rejects objects carrying both casings of the
 * same field ("duplicate field"), so per-object purity is load-bearing.
 */
function canonicalize<Raw, Parsed>(schema: Schema<Raw, Parsed>, raw: unknown): Parsed {
    const result = schema.parse(raw, PARSE_OPTS);
    return result.ok ? result.value : (raw as Parsed);
}

export function deepCopyCompany(c: Schematic.RulesengineCompany): Schematic.RulesengineCompany {
    return JSON.parse(JSON.stringify(c));
}

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
 *   - creditRemaining ← credit_balances[credit_id] (or credit_lease_balance[credit_id].remaining)
 *   - usage ← metric value matching (eventName, metricPeriod, monthReset)
 * Both are skipped when the partial also sends entitlements wholesale.
 *
 * Partial updates arrive as raw wire payloads (snake_case keys) and are merged
 * into an existing camelCase-canonicalized entity; each case writes the
 * corresponding camelCase field so the cached entity stays in a single shape.
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
            case "entitlements": {
                const incoming = (partial[key] ?? []) as unknown[];
                merged.entitlements = incoming.map((e) =>
                    canonicalize(serializers.RulesengineFeatureEntitlement, e),
                );
                break;
            }
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
                const incomingCB = (partial[key] ?? {}) as Record<string, number>;
                merged.creditBalances = { ...existingCB, ...incomingCB };
                updatedBalances = incomingCB;
                break;
            }
            case "credit_lease_balance": {
                // Atomic lease-balance partial: for each credit it carries the
                // post-move remaining together with the open lease hold
                // (reserved), emitted as a single message on lease
                // acquire/extend so a consumer never derives state from a
                // remaining and a reserved captured at different instants. This
                // SDK is lease-aware, gates on remaining locally, and derives no
                // settled balance, so we apply remaining exactly like the
                // credit_balances partial and ignore reserved.
                const existingCB = (merged.creditBalances ?? {}) as Record<string, number>;
                const incoming = (partial[key] ?? {}) as Record<string, { remaining?: number; reserved?: number }>;
                const remainingByCredit: Record<string, number> = {};
                for (const [creditId, lb] of Object.entries(incoming)) {
                    if (lb && typeof lb.remaining === "number") {
                        remainingByCredit[creditId] = lb.remaining;
                    }
                }
                merged.creditBalances = { ...existingCB, ...remainingByCredit };
                updatedBalances = { ...(updatedBalances ?? {}), ...remainingByCredit };
                break;
            }
            case "metrics": {
                const existingMetrics = (merged.metrics ?? []) as Schematic.RulesengineCompanyMetric[];
                const incomingMetrics = ((partial[key] ?? []) as unknown[]).map((m) =>
                    canonicalize(serializers.RulesengineCompanyMetric, m),
                );
                merged.metrics = upsertMetrics(existingMetrics, incomingMetrics);
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
 *   - creditRemaining ← the incoming balance for the entitlement's creditId
 *   - usage ← the merged metric value matching (eventName, metricPeriod, monthReset),
 *     defaulting metricPeriod to "all_time" and monthReset to "first_of_month"
 */
function syncEntitlementDerivedFields(
    merged: Record<string, unknown>,
    updatedBalances: Record<string, number> | undefined,
    metricsUpdated: boolean,
): void {
    const entitlements = (merged.entitlements ?? []) as Record<string, unknown>[];
    if (entitlements.length === 0) {
        return;
    }

    // Build a value lookup from the merged metrics, keyed the same way as the
    // upsert so entitlements can find their matching usage.
    const metricsLookup = new Map<string, number>();
    if (metricsUpdated) {
        const mergedMetrics = (merged.metrics ?? []) as Record<string, unknown>[];
        for (const m of mergedMetrics) {
            if (!m) continue;
            metricsLookup.set(metricKeyString(getMetricKey(m)), (m.value as number) ?? 0);
        }
    }

    for (const ent of entitlements) {
        const creditId = (ent.creditId ?? ent.credit_id) as string | undefined;
        if (updatedBalances && creditId && creditId in updatedBalances) {
            // Write the camelCase field: the cached entity is canonicalized, and
            // the WASM engine errors on an object carrying both casings.
            ent.creditRemaining = updatedBalances[creditId];
            delete ent.credit_remaining;
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
