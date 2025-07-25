/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { CreateEntitlementReqCommonMetricPeriod } from "./CreateEntitlementReqCommonMetricPeriod";
import { CreateEntitlementReqCommonMetricPeriodMonthReset } from "./CreateEntitlementReqCommonMetricPeriodMonthReset";
import { CreateEntitlementReqCommonValueType } from "./CreateEntitlementReqCommonValueType";

export const CreateEntitlementReqCommon: core.serialization.ObjectSchema<
    serializers.CreateEntitlementReqCommon.Raw,
    Schematic.CreateEntitlementReqCommon
> = core.serialization.object({
    featureId: core.serialization.property("feature_id", core.serialization.string()),
    metricPeriod: core.serialization.property("metric_period", CreateEntitlementReqCommonMetricPeriod.optional()),
    metricPeriodMonthReset: core.serialization.property(
        "metric_period_month_reset",
        CreateEntitlementReqCommonMetricPeriodMonthReset.optional(),
    ),
    valueBool: core.serialization.property("value_bool", core.serialization.boolean().optional()),
    valueCreditId: core.serialization.property("value_credit_id", core.serialization.string().optional()),
    valueNumeric: core.serialization.property("value_numeric", core.serialization.number().optional()),
    valueTraitId: core.serialization.property("value_trait_id", core.serialization.string().optional()),
    valueType: core.serialization.property("value_type", CreateEntitlementReqCommonValueType),
});

export declare namespace CreateEntitlementReqCommon {
    export interface Raw {
        feature_id: string;
        metric_period?: CreateEntitlementReqCommonMetricPeriod.Raw | null;
        metric_period_month_reset?: CreateEntitlementReqCommonMetricPeriodMonthReset.Raw | null;
        value_bool?: boolean | null;
        value_credit_id?: string | null;
        value_numeric?: number | null;
        value_trait_id?: string | null;
        value_type: CreateEntitlementReqCommonValueType.Raw;
    }
}
