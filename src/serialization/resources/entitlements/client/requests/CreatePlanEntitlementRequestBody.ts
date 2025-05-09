/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { CreatePlanEntitlementRequestBodyMetricPeriod } from "../../types/CreatePlanEntitlementRequestBodyMetricPeriod";
import { CreatePlanEntitlementRequestBodyMetricPeriodMonthReset } from "../../types/CreatePlanEntitlementRequestBodyMetricPeriodMonthReset";
import { CreatePlanEntitlementRequestBodyValueType } from "../../types/CreatePlanEntitlementRequestBodyValueType";

export const CreatePlanEntitlementRequestBody: core.serialization.Schema<
    serializers.CreatePlanEntitlementRequestBody.Raw,
    Schematic.CreatePlanEntitlementRequestBody
> = core.serialization.object({
    featureId: core.serialization.property("feature_id", core.serialization.string()),
    metricPeriod: core.serialization.property("metric_period", CreatePlanEntitlementRequestBodyMetricPeriod.optional()),
    metricPeriodMonthReset: core.serialization.property(
        "metric_period_month_reset",
        CreatePlanEntitlementRequestBodyMetricPeriodMonthReset.optional(),
    ),
    monthlyMeteredPriceId: core.serialization.property(
        "monthly_metered_price_id",
        core.serialization.string().optional(),
    ),
    planId: core.serialization.property("plan_id", core.serialization.string()),
    priceBehavior: core.serialization.property("price_behavior", core.serialization.string().optional()),
    softLimit: core.serialization.property("soft_limit", core.serialization.number().optional()),
    valueBool: core.serialization.property("value_bool", core.serialization.boolean().optional()),
    valueNumeric: core.serialization.property("value_numeric", core.serialization.number().optional()),
    valueTraitId: core.serialization.property("value_trait_id", core.serialization.string().optional()),
    valueType: core.serialization.property("value_type", CreatePlanEntitlementRequestBodyValueType),
    yearlyMeteredPriceId: core.serialization.property(
        "yearly_metered_price_id",
        core.serialization.string().optional(),
    ),
});

export declare namespace CreatePlanEntitlementRequestBody {
    export interface Raw {
        feature_id: string;
        metric_period?: CreatePlanEntitlementRequestBodyMetricPeriod.Raw | null;
        metric_period_month_reset?: CreatePlanEntitlementRequestBodyMetricPeriodMonthReset.Raw | null;
        monthly_metered_price_id?: string | null;
        plan_id: string;
        price_behavior?: string | null;
        soft_limit?: number | null;
        value_bool?: boolean | null;
        value_numeric?: number | null;
        value_trait_id?: string | null;
        value_type: CreatePlanEntitlementRequestBodyValueType.Raw;
        yearly_metered_price_id?: string | null;
    }
}
