/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../../index";

/**
 * @example
 *     {
 *         featureId: "feature_id",
 *         planId: "plan_id",
 *         valueType: "boolean"
 *     }
 */
export interface CreatePlanEntitlementRequestBody {
    featureId: string;
    meteredMonthlyPriceId?: string;
    meteredYearlyPriceId?: string;
    metricPeriod?: Schematic.CreatePlanEntitlementRequestBodyMetricPeriod;
    metricPeriodMonthReset?: Schematic.CreatePlanEntitlementRequestBodyMetricPeriodMonthReset;
    monthlyMeteredPriceId?: string;
    planId: string;
    priceBehavior?: string;
    valueBool?: boolean;
    valueNumeric?: number;
    valueTraitId?: string;
    valueType: Schematic.CreatePlanEntitlementRequestBodyValueType;
    yearlyMeteredPriceId?: string;
}
