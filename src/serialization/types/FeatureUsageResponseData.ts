/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { FeatureUsageResponseDataAllocationType } from "./FeatureUsageResponseDataAllocationType";
import { FeatureDetailResponseData } from "./FeatureDetailResponseData";
import { BillingPriceView } from "./BillingPriceView";
import { PlanResponseData } from "./PlanResponseData";

export const FeatureUsageResponseData: core.serialization.ObjectSchema<
    serializers.FeatureUsageResponseData.Raw,
    Schematic.FeatureUsageResponseData
> = core.serialization.object({
    access: core.serialization.boolean(),
    allocation: core.serialization.number().optional(),
    allocationType: core.serialization.property("allocation_type", FeatureUsageResponseDataAllocationType),
    entitlementExpirationDate: core.serialization.property(
        "entitlement_expiration_date",
        core.serialization.date().optional(),
    ),
    entitlementId: core.serialization.property("entitlement_id", core.serialization.string()),
    entitlementType: core.serialization.property("entitlement_type", core.serialization.string()),
    feature: FeatureDetailResponseData.optional(),
    metricResetAt: core.serialization.property("metric_reset_at", core.serialization.date().optional()),
    monthReset: core.serialization.property("month_reset", core.serialization.string().optional()),
    monthlyUsageBasedPrice: core.serialization.property("monthly_usage_based_price", BillingPriceView.optional()),
    period: core.serialization.string().optional(),
    plan: PlanResponseData.optional(),
    priceBehavior: core.serialization.property("price_behavior", core.serialization.string().optional()),
    softLimit: core.serialization.property("soft_limit", core.serialization.number().optional()),
    usage: core.serialization.number().optional(),
    yearlyUsageBasedPrice: core.serialization.property("yearly_usage_based_price", BillingPriceView.optional()),
});

export declare namespace FeatureUsageResponseData {
    export interface Raw {
        access: boolean;
        allocation?: number | null;
        allocation_type: FeatureUsageResponseDataAllocationType.Raw;
        entitlement_expiration_date?: string | null;
        entitlement_id: string;
        entitlement_type: string;
        feature?: FeatureDetailResponseData.Raw | null;
        metric_reset_at?: string | null;
        month_reset?: string | null;
        monthly_usage_based_price?: BillingPriceView.Raw | null;
        period?: string | null;
        plan?: PlanResponseData.Raw | null;
        price_behavior?: string | null;
        soft_limit?: number | null;
        usage?: number | null;
        yearly_usage_based_price?: BillingPriceView.Raw | null;
    }
}
