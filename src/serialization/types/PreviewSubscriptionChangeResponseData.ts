/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { PreviewSubscriptionFinanceResponseData } from "./PreviewSubscriptionFinanceResponseData";
import { FeatureUsageResponseData } from "./FeatureUsageResponseData";

export const PreviewSubscriptionChangeResponseData: core.serialization.ObjectSchema<
    serializers.PreviewSubscriptionChangeResponseData.Raw,
    Schematic.PreviewSubscriptionChangeResponseData
> = core.serialization.object({
    amountOff: core.serialization.property("amount_off", core.serialization.number()),
    dueNow: core.serialization.property("due_now", core.serialization.number()),
    finance: PreviewSubscriptionFinanceResponseData.optional(),
    newCharges: core.serialization.property("new_charges", core.serialization.number()),
    paymentMethodRequired: core.serialization.property("payment_method_required", core.serialization.boolean()),
    percentOff: core.serialization.property("percent_off", core.serialization.number()),
    periodStart: core.serialization.property("period_start", core.serialization.date()),
    promoCodeApplied: core.serialization.property("promo_code_applied", core.serialization.boolean()),
    proration: core.serialization.number(),
    trialEnd: core.serialization.property("trial_end", core.serialization.date().optional()),
    usageViolations: core.serialization.property("usage_violations", core.serialization.list(FeatureUsageResponseData)),
});

export declare namespace PreviewSubscriptionChangeResponseData {
    export interface Raw {
        amount_off: number;
        due_now: number;
        finance?: PreviewSubscriptionFinanceResponseData.Raw | null;
        new_charges: number;
        payment_method_required: boolean;
        percent_off: number;
        period_start: string;
        promo_code_applied: boolean;
        proration: number;
        trial_end?: string | null;
        usage_violations: FeatureUsageResponseData.Raw[];
    }
}
