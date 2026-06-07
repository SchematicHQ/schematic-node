import { randomUUID } from "crypto";

import type * as api from "../api";
import type { CreditsClient } from "../api/resources/credits/client/Client";
import type { DataStreamClient } from "../datastream";
import type { Logger } from "../logger";
import type { WasmFeatureEntitlement } from "../rules-engine";
import type { CheckFlagOptions } from "../wrapper";

import { CreditLeaseManager } from "./lease-manager";
import type { ILeaseStore } from "./lease-store";
import type { IReservationStore } from "./reservation-store";
import type { CheckOptions, CheckResult, OnAcquireFailure, Reservation, ResolvedLeaseConfig } from "./types";

/** Internal helper bundling everything needed to satisfy a lease-bearing check. */
export interface CreditCheckDeps {
    leaseStore: ILeaseStore;
    reservations: IReservationStore;
    manager: CreditLeaseManager;
    datastream: DataStreamClient | undefined;
    logger: Logger;
    /**
     * Report a `flag_check` event for a check the lease path resolved itself.
     * Mirrors the plain `checkFlag` paths (which enqueue one per check) so
     * lease-gated checks stay visible to flag-check analytics and company
     * last-seen. Fallback exits don't call this — the plain check they
     * delegate to enqueues its own.
     */
    enqueueFlagCheckEvent: (body: api.EventBodyFlagCheck) => void;
}

/** Enqueue the flag_check event for a lease-path resolution and pass the result through. */
function emitFlagCheck(
    deps: CreditCheckDeps,
    evalCtx: api.CheckFlagRequestBody,
    result: CheckResult,
    ids?: { companyId?: string; userId?: string; ruleId?: string },
): CheckResult {
    deps.enqueueFlagCheckEvent({
        flagKey: result.flagKey,
        value: result.value,
        reason: result.reason,
        error: result.err,
        flagId: result.flagId,
        companyId: ids?.companyId,
        userId: ids?.userId,
        ruleId: ids?.ruleId,
        reqCompany: evalCtx.company,
        reqUser: evalCtx.user,
    });
    return result;
}

/**
 * Drives a single `client.check` with `usage` set.
 *
 * Steps:
 *   1. Resolve the matching credit-balance condition on the flag to get
 *      `creditId` + `consumptionRate`.
 *   2. Acquire (or reuse) a lease for `(company, creditId)`.
 *   3. Try to reserve `quantity × consumptionRate` from the lease.
 *   4. Run the WASM rules engine against a substituted company snapshot
 *      (`credit_balances[creditId] = lease.localRemaining` *before* the
 *      reservation we just made was debited), plus `event_usage` options so
 *      the engine evaluates the post-call balance. The reservation we made
 *      in step 3 only sticks if the engine says allowed.
 */
export async function checkWithLease(
    deps: CreditCheckDeps,
    key: string,
    evalCtx: api.CheckFlagRequestBody,
    options: CheckOptions,
    fallback: () => Promise<CheckResult>,
): Promise<CheckResult> {
    const { datastream, leaseStore, reservations, manager, logger } = deps;
    const onFailure = options.onAcquireFailure ?? "fail-closed";

    // A malformed `usage` must never reach the stores: NaN slips through every
    // numeric comparison (`NaN <= 0` and `balance < NaN` are both false), so a
    // single NaN debit would silently poison the — possibly shared — lease
    // balance into approving every subsequent reserve until the lease is
    // replaced. The stores also guard individually, but resolve it here
    // through the caller's fail-open/fail-closed contract instead of letting
    // it surface as an opaque reserve failure.
    if (options.usage === undefined || !Number.isFinite(options.usage) || options.usage < 0) {
        logger.error(
            `Lease check: invalid usage ${options.usage} for flag ${key} — must be a finite, non-negative number`,
        );
        return emitFlagCheck(deps, evalCtx, staticFailureResult(onFailure, key, "invalid_usage", null));
    }

    // Zero usage means nothing to reserve — use the plain check (preflight
    // still threaded) instead of issuing a no-op 0-credit handle.
    if (options.usage === 0) {
        logger.debug(`Lease check: usage is 0 for flag ${key} — nothing to reserve, using plain check`);
        return fallback();
    }

    if (!datastream) {
        logger.debug("Credit-lease check requested without datastream — falling back to plain check");
        return fallback();
    }

    let flag: api.RulesengineFlag | null = null;
    try {
        flag = await datastream.getFlag(key);
    } catch (err) {
        logger.warn(`Lease check: failed to load flag ${key}: ${err}`);
    }
    if (!flag) {
        logger.debug(`Lease check: no cached flag for ${key}, falling back`);
        return fallback();
    }

    const { eventSubtype, quantity } = extractPreflightQuantity(options);

    if (!evalCtx.company) {
        logger.debug("Lease check: no company on evalCtx, falling back");
        return fallback();
    }

    // Resolve company + user the same way a plain datastream flag check does:
    // cache-first, then a live fetch over the WS that waits for the entity to
    // stream back. Evaluating with a missing entity is not an option — a null
    // user would silently skip user-targeted rules/overrides. If either entity
    // the caller named can't be resolved (replicator cache miss, WS down),
    // fall back to the plain check, which has its own degradation story.
    let company: api.RulesengineCompany | null = null;
    try {
        company = await datastream.getCompany(evalCtx.company);
    } catch (err) {
        logger.debug(
            `Lease check: company fetch failed for keys ${JSON.stringify(evalCtx.company)} (${err}), falling back`,
        );
    }
    if (!company) {
        return fallback();
    }

    let user: api.RulesengineUser | null = null;
    if (evalCtx.user) {
        try {
            user = await datastream.getUser(evalCtx.user);
        } catch (err) {
            logger.debug(
                `Lease check: user fetch failed for keys ${JSON.stringify(evalCtx.user)} (${err}), falling back`,
            );
        }
        if (!user) {
            return fallback();
        }
    }

    // A flag can carry credit conditions from several plans, each metering a
    // different credit type. Lease the credit the company's *matched* plan
    // entitlement actually uses — not whichever credit condition is declared
    // first on the flag. We can't read that off the flag structurally (a
    // condition doesn't know which rule the company matched), so we probe the
    // engine: its entitlement reports the plan-correct creditId regardless of
    // balance. Falls back to first-match for single-credit flags or when the
    // probe can't resolve a credit.
    const match = await resolveCreditCondition(datastream, flag, company, user, eventSubtype, logger);
    if (!match) {
        logger.debug(
            `Lease check: flag ${key} has no matching credit condition (subtype=${eventSubtype ?? "<none>"}), falling back`,
        );
        return fallback();
    }

    const creditId = match.condition.creditId;
    const consumptionRate = match.condition.consumptionRate ?? 0;
    if (consumptionRate <= 0) {
        logger.debug(`Lease check: condition has no consumption_rate, falling back`);
        return fallback();
    }
    // The reservation settles into a Track event named by this subtype; an
    // empty event name would consume the reservation while billing nothing,
    // so a condition with no resolvable subtype is treated like one with no
    // consumption_rate.
    const resolvedSubtype = eventSubtype ?? match.condition.eventSubtype;
    if (!resolvedSubtype) {
        logger.debug(`Lease check: credit condition has no event subtype, falling back`);
        return fallback();
    }
    const creditCost = quantity * consumptionRate;

    // Thread the caller's per-check timeout to the lease wire calls
    // (acquire/extend) the same way the fallback path threads it to checkFlag.
    const requestOptions: CreditsClient.RequestOptions | undefined =
        options.timeoutMs !== undefined ? { timeoutInSeconds: options.timeoutMs / 1000 } : undefined;

    // Every can't-gate outcome — wire failure, store (Redis) failure,
    // exhausted lease — funnels through here so the fail-open/fail-closed
    // contract holds even when the backing infrastructure is down.
    const failure = (reason: string): Promise<CheckResult> =>
        handleLeaseFailure({
            datastream,
            logger,
            mode: onFailure,
            key,
            reason,
            flag,
            company,
            user,
            creditId,
            options,
        }).then((result) => emitFlagCheck(deps, evalCtx, result, { companyId: company.id, userId: user?.id }));

    const lease = await manager.acquireIfNeeded(company.id, creditId, requestOptions);
    if (!lease) {
        return failure("lease_acquire_failed");
    }

    // `tryReserve` is the atomic gate: check-and-debit in one step, returning
    // the post-debit balance on success (so we can derive the pre-debit figure
    // below without a follow-up store read).
    let postReserveBalance: number | null;
    try {
        postReserveBalance = await leaseStore.tryReserve(company.id, creditId, creditCost);
        if (postReserveBalance === null) {
            // Lease has less than `creditCost` left locally. Pass `creditCost` so
            // `maybeExtendInBackground` extends even when the ratio is still above
            // the low-watermark (e.g. a single large request).
            await manager.maybeExtendInBackground(company.id, creditId, creditCost, requestOptions);
            postReserveBalance = await leaseStore.tryReserve(company.id, creditId, creditCost);
        }
    } catch (err) {
        logger.error(`Lease check: reserve against ${company.id}/${creditId} failed: ${err}`);
        return failure("lease_store_error");
    }
    if (postReserveBalance === null) {
        return failure("insufficient_lease_balance");
    }

    // Record the reservation *before* the WASM eval. The debit above and this
    // record are two steps; persisting the hold first means a crash between
    // them leaves a sweepable reservation (refunded at its TTL) rather than
    // stranding the debited credits until the whole lease expires. The
    // remaining unprotected window is just the gap between the debit and this
    // add (no I/O in between); a crash there leaks at most `creditCost` until
    // the lease's own expiry reclaims it server-side.
    const reservation = registerReservation({
        leaseId: lease.leaseId,
        companyId: company.id,
        creditTypeId: creditId,
        eventSubtype: resolvedSubtype,
        quantityReserved: quantity,
        creditsReserved: creditCost,
        consumptionRate,
        reservationTTL: resolveReservationTTL(deps, creditId),
        evalCtx,
    });

    try {
        await reservations.add(reservation);
    } catch (err) {
        logger.error(`Lease check: failed to persist reservation ${reservation.id}: ${err}`);
        // Undo the local debit so the credits aren't stranded until lease
        // expiry. `consume` claims whatever slice of `add` made it to the
        // store and refunds it; if nothing was persisted (`null`), refund the
        // debit directly. Both pinned to this lease. If even the undo fails,
        // accept the bounded leak — the slice is reclaimed when the lease
        // expires server-side, which beats risking a double refund.
        try {
            const undone = await reservations.consume(reservation.id, 0);
            if (undone === null) {
                await leaseStore.refund(company.id, creditId, creditCost, lease.leaseId);
            }
        } catch (undoErr) {
            logger.warn(
                `Lease check: could not undo local debit for ${reservation.id} (${undoErr}); the slice is reclaimed at lease expiry`,
            );
        }
        return failure("lease_store_error");
    }

    // Substitute the lease balance into the company snapshot so the engine
    // gates against the lease's local view, not the server's authoritative
    // balance. We use the *pre-reservation* localRemaining + event_usage so
    // the engine computes `pre - qty*rate >= 0` — the same arithmetic
    // `tryReserve` just enforced. Pre-reservation = the post-debit balance the
    // atomic reserve returned + the creditCost it debited — exact as of the
    // debit, no read race.
    const preReservation = postReserveBalance + creditCost;
    const substituted = substituteCreditBalance(company, creditId, preReservation);

    const wasmOptions = buildPreflightOptions(options);
    let result;
    try {
        result = await datastream.getRulesEngine().checkFlagWithOptions(flag, substituted, user ?? null, wasmOptions);
    } catch (err) {
        logger.error(`Lease check: WASM eval failed: ${err}`);
        // Cancel the hold: removes the reservation record and refunds the full
        // reserved amount back to the lease in one atomic step. The engine
        // itself just failed, so skip the fail-open re-eval and resolve the
        // mode statically.
        await cancelReservation(reservations, reservation, logger);
        return emitFlagCheck(deps, evalCtx, staticFailureResult(onFailure, key, `wasm_error: ${err}`, flag), {
            companyId: company.id,
            userId: user?.id,
        });
    }

    // Engine-evaluated exits report the engine's resolved ids, mirroring the
    // plain datastream path's flag_check event.
    const ids = {
        companyId: result.companyId ?? company.id,
        userId: result.userId ?? user?.id,
        ruleId: result.ruleId,
    };

    if (!result.value) {
        await cancelReservation(reservations, reservation, logger);
        return emitFlagCheck(
            deps,
            evalCtx,
            {
                allowed: false,
                value: false,
                reason: result.reason ?? "denied_by_engine",
                entitlement: normalizeEntitlement(result.entitlement),
                flagKey: result.flagKey ?? key,
                flagId: result.flagId,
            },
            ids,
        );
    }

    // The engine allowed — but keep the hold only if the allow actually came
    // from the rule whose credit condition we reserved against. An allow via a
    // different rule (company/global override, another plan's rule) grants the
    // feature without metering this credit, so keeping the reservation would
    // bill usage the matched rule grants for free. Cancel it and return the
    // allow without a handle — `trackWithReservation` is never owed. Only a
    // definitive mismatch cancels: if the engine doesn't report a ruleId, the
    // reservation is kept rather than silently disabling credit gating.
    if (result.ruleId !== undefined && result.ruleId !== match.ruleId) {
        logger.debug(
            `Lease check: flag ${key} allowed by rule ${result.ruleId} (${result.ruleType ?? "unknown type"}), ` +
                `not the credit-metered rule ${match.ruleId} — cancelling reservation, no credits billed`,
        );
        await cancelReservation(reservations, reservation, logger);
        return emitFlagCheck(
            deps,
            evalCtx,
            {
                allowed: true,
                value: true,
                reason: result.reason ?? "allowed_without_credit_rule",
                entitlement: normalizeEntitlement(result.entitlement),
                flagKey: result.flagKey ?? key,
                flagId: result.flagId,
            },
            ids,
        );
    }

    // Fire-and-forget low-water-mark refresh now that we've debited.
    void manager.maybeExtendInBackground(company.id, creditId);

    return emitFlagCheck(
        deps,
        evalCtx,
        {
            allowed: true,
            value: true,
            reservation,
            reason: result.reason ?? "lease_reserved",
            entitlement: normalizeEntitlement(result.entitlement),
            flagKey: result.flagKey ?? key,
            flagId: result.flagId,
        },
        ids,
    );
}

function resolveReservationTTL(deps: CreditCheckDeps, creditId: string): ResolvedLeaseConfig {
    return deps.manager.resolveConfig(creditId);
}

function extractPreflightQuantity(options: CheckOptions): {
    eventSubtype: string | undefined;
    quantity: number;
} {
    return { eventSubtype: options.eventSubtype, quantity: options.usage ?? 0 };
}

/**
 * Build the preflight options envelope for a client-side rules evaluation.
 * With an `eventSubtype` the quantity goes out as the `event_usage` pair so
 * the engine matches it to the subtype's condition; without one it goes out
 * as the generic `usage` knob. Exported so `client.check`'s fallback path can
 * thread the same preflight through a plain flag check — any client-side
 * evaluation (datastream, replicator) honors it even when the lease path
 * can't run.
 */
export function buildPreflightOptions(options: CheckOptions): CheckFlagOptions | undefined {
    if (options.usage === undefined) return undefined;
    if (options.eventSubtype !== undefined) {
        return { eventUsage: { eventSubtype: options.eventSubtype, quantity: options.usage } };
    }
    return { usage: options.usage };
}

interface CreditConditionMatch {
    condition: api.RulesengineCondition & { creditId: string };
    /**
     * Id of the rule the condition belongs to. After the gating eval, the
     * reservation is kept only if the engine's matched `ruleId` is this rule —
     * an allow via a different rule (company/global override, another plan's
     * rule) grants the feature without metering this credit, so the hold is
     * cancelled instead of billed.
     */
    ruleId: string;
}

/**
 * Resolve the credit condition to lease against. A flag can declare credit
 * conditions for several credit types — one per plan that entitles the feature
 * — and the right one for this company is the credit its *matched* plan
 * entitlement uses, which only the rules engine knows.
 *
 * When the flag meters this event subtype in a single credit type (the common
 * case) the first matching condition is unambiguous and we return it directly,
 * with no extra engine call. Only when conditions disagree on credit type do
 * we probe: the engine's `entitlement.creditId` names the company's metered
 * credit regardless of balance, and we select that credit's condition to read
 * its `consumption_rate`. A probe that can't resolve a credit (non-credit
 * entitlement or an error) falls back to first-match, preserving prior
 * behavior.
 */
async function resolveCreditCondition(
    datastream: DataStreamClient,
    flag: api.RulesengineFlag,
    company: api.RulesengineCompany,
    user: object | null,
    eventSubtype: string | undefined,
    logger: Logger,
): Promise<CreditConditionMatch | null> {
    const first = findCreditCondition(flag, eventSubtype);
    if (!first) return null;
    if (collectCreditIds(flag, eventSubtype).size <= 1) return first;

    try {
        const probe = await datastream.getRulesEngine().checkFlagWithOptions(flag, company, user, null);
        const creditId = probe.entitlement?.creditId;
        if (creditId) {
            const byCredit = findCreditCondition(flag, eventSubtype, creditId);
            if (byCredit) return byCredit;
            logger.debug(
                `Lease check: entitlement credit ${creditId} has no matching condition on flag, falling back to first credit condition`,
            );
        }
    } catch (err) {
        logger.warn(`Lease check: credit-resolution probe failed (${err}), falling back to first credit condition`);
    }
    return first;
}

/** Distinct credit-type ids across the flag's credit conditions for `eventSubtype`. */
function collectCreditIds(flag: api.RulesengineFlag, eventSubtype: string | undefined): Set<string> {
    const ids = new Set<string>();
    const scan = (conditions: api.RulesengineCondition[]) => {
        for (const c of conditions) {
            if (c.conditionType !== "credit" || !c.creditId) continue;
            if (eventSubtype !== undefined && c.eventSubtype !== eventSubtype) continue;
            ids.add(c.creditId);
        }
    };
    for (const rule of flag.rules ?? []) {
        scan(rule.conditions ?? []);
        for (const group of rule.conditionGroups ?? []) scan(group.conditions ?? []);
    }
    return ids;
}

function findCreditCondition(
    flag: api.RulesengineFlag,
    eventSubtype: string | undefined,
    creditId?: string,
): CreditConditionMatch | null {
    for (const rule of flag.rules ?? []) {
        const inRule = matchInConditions(rule.conditions ?? [], eventSubtype, creditId);
        if (inRule) return { ...inRule, ruleId: rule.id };
        for (const group of rule.conditionGroups ?? []) {
            const inGroup = matchInConditions(group.conditions ?? [], eventSubtype, creditId);
            if (inGroup) return { ...inGroup, ruleId: rule.id };
        }
    }
    return null;
}

function matchInConditions(
    conditions: api.RulesengineCondition[],
    eventSubtype: string | undefined,
    creditId?: string,
): Omit<CreditConditionMatch, "ruleId"> | null {
    for (const c of conditions) {
        if (c.conditionType !== "credit") continue;
        if (!c.creditId) continue;
        if (eventSubtype !== undefined && c.eventSubtype !== eventSubtype) continue;
        if (creditId !== undefined && c.creditId !== creditId) continue;
        return { condition: c as api.RulesengineCondition & { creditId: string } };
    }
    return null;
}

function substituteCreditBalance(
    company: api.RulesengineCompany,
    creditId: string,
    balance: number,
): api.RulesengineCompany {
    return {
        ...company,
        creditBalances: {
            ...(company.creditBalances ?? {}),
            [creditId]: balance,
        },
    };
}

function registerReservation(args: {
    leaseId: string;
    companyId: string;
    creditTypeId: string;
    eventSubtype: string;
    quantityReserved: number;
    creditsReserved: number;
    consumptionRate: number;
    reservationTTL: ResolvedLeaseConfig;
    evalCtx: api.CheckFlagRequestBody;
}): Reservation {
    return {
        id: randomUUID(),
        leaseId: args.leaseId,
        companyId: args.companyId,
        creditTypeId: args.creditTypeId,
        eventSubtype: args.eventSubtype,
        quantityReserved: args.quantityReserved,
        creditsReserved: args.creditsReserved,
        consumptionRate: args.consumptionRate,
        expiresAt: new Date(Date.now() + args.reservationTTL.reservationTTL),
        evalCtx: args.evalCtx,
    };
}

function normalizeEntitlement(raw: WasmFeatureEntitlement | undefined): api.RulesengineFeatureEntitlement | undefined {
    if (!raw) return undefined;
    return {
        ...raw,
        metricResetAt: raw.metricResetAt ? new Date(raw.metricResetAt) : undefined,
    };
}

/** Best-effort reservation cancel: claims the record and refunds its full hold. */
async function cancelReservation(
    reservations: IReservationStore,
    reservation: Reservation,
    logger: Logger,
): Promise<void> {
    try {
        await reservations.consume(reservation.id, 0);
    } catch (err) {
        logger.warn(
            `Lease check: failed to cancel reservation ${reservation.id} (${err}); its hold is reclaimed by the sweeper or at lease expiry`,
        );
    }
}

// Balance substituted for the fail-open evaluation: large enough that the
// credit gate always passes, finite so it serializes cleanly to the WASM.
const FAIL_OPEN_BALANCE = Number.MAX_SAFE_INTEGER;

/**
 * Resolve a can't-gate outcome (lease acquire failed, store unreachable,
 * lease exhausted) according to the configured mode.
 *
 * `fail-closed` denies outright. `fail-open` means "err on the side of
 * assuming the credits are there" — NOT "skip evaluation": the rules engine
 * still runs with the credit balance substituted to an effectively unlimited
 * value, so plan targeting, company/user overrides, and every non-credit
 * condition still apply. A company that isn't entitled to the feature stays
 * denied even when the lease backend is down. Only if that evaluation itself
 * errors do we fall back to a blanket allow.
 */
async function handleLeaseFailure(args: {
    datastream: DataStreamClient;
    logger: Logger;
    mode: OnAcquireFailure;
    key: string;
    reason: string;
    flag: api.RulesengineFlag;
    company: api.RulesengineCompany;
    user: api.RulesengineUser | null;
    creditId: string;
    options: CheckOptions;
}): Promise<CheckResult> {
    const { datastream, logger, mode, key, reason, flag, company, user, creditId, options } = args;
    if (mode === "fail-closed") {
        return staticFailureResult(mode, key, reason, flag);
    }

    try {
        const substituted = substituteCreditBalance(company, creditId, FAIL_OPEN_BALANCE);
        const result = await datastream
            .getRulesEngine()
            .checkFlagWithOptions(flag, substituted, user, buildPreflightOptions(options));
        return {
            allowed: result.value,
            value: result.value,
            reason: `${result.reason ?? "evaluated"} (${reason}_fail_open)`,
            entitlement: normalizeEntitlement(result.entitlement),
            flagKey: result.flagKey ?? key,
            flagId: result.flagId ?? flag.id,
            err: reason,
        };
    } catch (err) {
        logger.warn(`Lease check: fail-open evaluation failed (${err}); allowing`);
        return staticFailureResult(mode, key, reason, flag);
    }
}

/**
 * Mode resolved without an engine evaluation: deny for fail-closed, blanket
 * allow for fail-open. Used directly when the engine itself is the thing
 * that failed, and as the fallback when the fail-open evaluation errors.
 */
function staticFailureResult(
    mode: OnAcquireFailure,
    flagKey: string,
    reason: string,
    flag: api.RulesengineFlag | null,
): CheckResult {
    if (mode === "fail-closed") {
        return {
            allowed: false,
            value: false,
            reason,
            flagKey,
            flagId: flag?.id,
            err: reason,
        };
    }
    return {
        allowed: true,
        value: true,
        reason: `${reason}_fail_open`,
        flagKey,
        flagId: flag?.id,
        err: reason,
    };
}
