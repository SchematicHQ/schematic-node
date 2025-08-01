/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { UpdatePlanEntitlementRequestBodyMetricPeriod } from "../../types/UpdatePlanEntitlementRequestBodyMetricPeriod";
import { UpdatePlanEntitlementRequestBodyMetricPeriodMonthReset } from "../../types/UpdatePlanEntitlementRequestBodyMetricPeriodMonthReset";
import { UpdatePlanEntitlementRequestBodyPriceBehavior } from "../../types/UpdatePlanEntitlementRequestBodyPriceBehavior";
import { CreatePriceTierRequestBody } from "../../../../types/CreatePriceTierRequestBody";
import { UpdatePlanEntitlementRequestBodyValueType } from "../../types/UpdatePlanEntitlementRequestBodyValueType";

export const UpdatePlanEntitlementRequestBody: core.serialization.Schema<
    serializers.UpdatePlanEntitlementRequestBody.Raw,
    Schematic.UpdatePlanEntitlementRequestBody
> = core.serialization.object({
    creditConsumptionRate: core.serialization.property(
        "credit_consumption_rate",
        core.serialization.number().optional(),
    ),
    currency: core.serialization.string().optional(),
    metricPeriod: core.serialization.property("metric_period", UpdatePlanEntitlementRequestBodyMetricPeriod.optional()),
    metricPeriodMonthReset: core.serialization.property(
        "metric_period_month_reset",
        UpdatePlanEntitlementRequestBodyMetricPeriodMonthReset.optional(),
    ),
    monthlyMeteredPriceId: core.serialization.property(
        "monthly_metered_price_id",
        core.serialization.string().optional(),
    ),
    monthlyUnitPrice: core.serialization.property("monthly_unit_price", core.serialization.number().optional()),
    monthlyUnitPriceDecimal: core.serialization.property(
        "monthly_unit_price_decimal",
        core.serialization.string().optional(),
    ),
    overageBillingProductId: core.serialization.property(
        "overage_billing_product_id",
        core.serialization.string().optional(),
    ),
    priceBehavior: core.serialization.property(
        "price_behavior",
        UpdatePlanEntitlementRequestBodyPriceBehavior.optional(),
    ),
    priceTiers: core.serialization.property("price_tiers", core.serialization.list(CreatePriceTierRequestBody)),
    softLimit: core.serialization.property("soft_limit", core.serialization.number().optional()),
    tierMode: core.serialization.property("tier_mode", core.serialization.string()),
    valueBool: core.serialization.property("value_bool", core.serialization.boolean().optional()),
    valueCreditId: core.serialization.property("value_credit_id", core.serialization.string().optional()),
    valueNumeric: core.serialization.property("value_numeric", core.serialization.number().optional()),
    valueTraitId: core.serialization.property("value_trait_id", core.serialization.string().optional()),
    valueType: core.serialization.property("value_type", UpdatePlanEntitlementRequestBodyValueType),
    yearlyMeteredPriceId: core.serialization.property(
        "yearly_metered_price_id",
        core.serialization.string().optional(),
    ),
    yearlyUnitPrice: core.serialization.property("yearly_unit_price", core.serialization.number().optional()),
    yearlyUnitPriceDecimal: core.serialization.property(
        "yearly_unit_price_decimal",
        core.serialization.string().optional(),
    ),
});

export declare namespace UpdatePlanEntitlementRequestBody {
    export interface Raw {
        credit_consumption_rate?: number | null;
        currency?: string | null;
        metric_period?: UpdatePlanEntitlementRequestBodyMetricPeriod.Raw | null;
        metric_period_month_reset?: UpdatePlanEntitlementRequestBodyMetricPeriodMonthReset.Raw | null;
        monthly_metered_price_id?: string | null;
        monthly_unit_price?: number | null;
        monthly_unit_price_decimal?: string | null;
        overage_billing_product_id?: string | null;
        price_behavior?: UpdatePlanEntitlementRequestBodyPriceBehavior.Raw | null;
        price_tiers: CreatePriceTierRequestBody.Raw[];
        soft_limit?: number | null;
        tier_mode: string;
        value_bool?: boolean | null;
        value_credit_id?: string | null;
        value_numeric?: number | null;
        value_trait_id?: string | null;
        value_type: UpdatePlanEntitlementRequestBodyValueType.Raw;
        yearly_metered_price_id?: string | null;
        yearly_unit_price?: number | null;
        yearly_unit_price_decimal?: string | null;
    }
}
