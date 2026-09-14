import type * as api from "../api";
import { PaymentRequiredError } from "../api";
import type { CreditsClient } from "../api/resources/credits/client/Client";
import type { FeaturesClient } from "../api/resources/features/client/Client";
import type { Logger } from "../logger";

import { buildPreflightOptions } from "./check";
import type { CheckOptions, CheckResult, OnAcquireFailure, Reservation } from "./types";

/** Everything `checkWithServerReservation` needs to satisfy a server-mode check. */
export interface ServerCheckDeps {
    features: FeaturesClient;
    credits: CreditsClient;
    logger: Logger;
    /** How far out to set the hold's `expiresAt` (ms). */
    reservationTTL: number;
    /**
     * Resolve the caller's default for this flag — `options.defaultValue` when
     * set, otherwise the client-level flag default. Used by the fail-open
     * branch, which has no local engine to re-run.
     */
    getDefault: () => boolean;
}

/**
 * Drives a single `client.check` with `usage` set, in server mode.
 *
 * One `POST /flags/{key}/check-and-reserve` call does everything the client
 * path spreads across a lease acquire, a local reserve, and a WASM eval: the
 * server evaluates the flag against the company's real balance, applies the
 * preflight cost, and takes the hold — all in the same round-trip. There is no
 * lease, no local store, and no rules engine involved.
 *
 * The failure contract differs from client mode in one place. `fail-open` there
 * means "re-run the engine with the credit balance assumed sufficient", so plan
 * targeting and every non-credit condition still apply. Server mode has no
 * local engine to re-run — the call that would have answered is the one that
 * failed — so `fail-open` returns the caller's default value
 * (`options.defaultValue`, else the client's configured flag default) instead.
 * `fail-closed` denies, same as client mode.
 *
 * No `flag_check` event is enqueued here: the server logs the flag check for
 * check-and-reserve itself, the same way the REST `checkFlag` path does.
 */
export async function checkWithServerReservation(
    deps: ServerCheckDeps,
    key: string,
    evalCtx: api.CheckFlagRequestBody,
    options: CheckOptions,
    fallback: () => Promise<CheckResult>,
): Promise<CheckResult> {
    const { features, credits, logger } = deps;
    const onFailure = options.onAcquireFailure ?? "fail-closed";

    // Same guard as the client path: a malformed `usage` must never reach the
    // wire. NaN slips through every numeric comparison, so the server would
    // size a hold off a value no comparison can reject. Resolve it through the
    // caller's fail-open/fail-closed contract instead.
    if (options.usage === undefined || !Number.isFinite(options.usage) || options.usage < 0) {
        logger.error(
            `Server reservation: invalid usage ${options.usage} for flag ${key} — must be a finite, non-negative number`,
        );
        return serverFailureResult(deps, onFailure, key, "invalid_usage");
    }

    // Zero usage means nothing to hold — use the plain check (preflight still
    // threaded) instead of asking the server for a 0-credit hold.
    if (options.usage === 0) {
        logger.debug(`Server reservation: usage is 0 for flag ${key} — nothing to reserve, using plain check`);
        return fallback();
    }

    const preflight = buildPreflightOptions(options) as api.PreflightRequestBody | undefined;
    const body: api.CheckAndReserveFlagRequestBody = {
        company: evalCtx.company,
        user: evalCtx.user,
        quantity: options.usage,
        expiresAt: new Date(Date.now() + deps.reservationTTL),
        preflight,
    };
    const requestOptions: FeaturesClient.RequestOptions | undefined =
        options.timeoutMs !== undefined ? { timeoutInSeconds: options.timeoutMs / 1000 } : undefined;

    let data: api.CheckAndReserveFlagResponseData;
    try {
        const resp = await features.checkAndReserveFlag(key, body, requestOptions);
        data = resp.data;
    } catch (err) {
        // A 402 is the server's definitive answer, not a can't-gate: it knows
        // the credits aren't there. Deny regardless of `onAcquireFailure` —
        // failing open here would hand out credit the balance can't cover.
        // check-and-reserve itself answers 200/value=false for insufficient
        // credits; this is defensive.
        if (err instanceof PaymentRequiredError) {
            return {
                allowed: false,
                value: false,
                reason: "insufficient_credits",
                flagKey: key,
                err: paymentRequiredMessage(err),
            };
        }
        logger.error(`Server reservation: check-and-reserve for flag ${key} failed: ${err}`);
        return serverFailureResult(deps, onFailure, key, "server_reservation_failed");
    }

    const base: CheckResult = {
        allowed: data.value,
        value: data.value,
        reason: data.reason,
        entitlement: data.entitlement as api.RulesengineFeatureEntitlement | undefined,
        flagKey: data.flag ?? key,
        flagId: data.flagId,
        err: data.error,
    };

    // No reservation comes back when the flag denied, the credits were
    // insufficient (200 with `value: false`), or the feature isn't
    // credit-metered. Nothing was held, so there is nothing to release.
    if (!data.value || !data.reservation) {
        return base;
    }

    const held = data.reservation;
    // The settling Track event is named by the event subtype; the caller's
    // explicit one wins, otherwise the server names it on the hold. With
    // neither, the hold can never be settled — release it now rather than
    // leaving credits parked until the TTL.
    const eventSubtype = options.eventSubtype ?? held.eventSubtype;
    if (!eventSubtype) {
        logger.error(
            `Server reservation: reservation ${held.id} for flag ${key} has no event subtype — releasing, it could never be settled`,
        );
        try {
            await credits.releaseCreditReservation(held.id);
        } catch (err) {
            logger.warn(
                `Server reservation: failed to release ${held.id} (${err}); its hold is refunded when it expires`,
            );
        }
        return serverFailureResult(deps, onFailure, key, "missing_event_subtype");
    }

    const reservation: Reservation = {
        id: held.id,
        // No lease exists in server mode; mirror the id so the required field
        // stays populated and a handle round-trips through code that reads it.
        leaseId: held.id,
        mode: "server",
        companyId: held.companyId,
        creditTypeId: held.creditTypeId,
        eventSubtype,
        quantityReserved: held.quantityReserved,
        creditsReserved: held.creditsReserved,
        consumptionRate: held.consumptionRate,
        expiresAt: held.expiresAt,
        evalCtx,
    };

    return {
        allowed: true,
        value: true,
        reservation,
        reason: data.reason,
        entitlement: data.entitlement as api.RulesengineFeatureEntitlement | undefined,
        flagKey: data.flag ?? key,
        flagId: data.flagId,
    };
}

/**
 * Resolve a can't-gate outcome in server mode. `fail-closed` denies;
 * `fail-open` returns the caller's default value — there is no local engine to
 * re-evaluate with an assumed-sufficient balance the way client mode does.
 */
function serverFailureResult(
    deps: ServerCheckDeps,
    mode: OnAcquireFailure,
    flagKey: string,
    reason: string,
): CheckResult {
    if (mode === "fail-closed") {
        return { allowed: false, value: false, reason, flagKey, err: reason };
    }
    const value = deps.getDefault();
    return { allowed: value, value, reason: `${reason}_fail_open`, flagKey, err: reason };
}

function paymentRequiredMessage(err: PaymentRequiredError): string | undefined {
    return err.body?.error ?? err.message;
}
