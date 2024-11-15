/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { UpdateCompanyOverrideRequestBodyMetricPeriod } from "../../types/UpdateCompanyOverrideRequestBodyMetricPeriod";
import { UpdateCompanyOverrideRequestBodyMetricPeriodMonthReset } from "../../types/UpdateCompanyOverrideRequestBodyMetricPeriodMonthReset";
import { UpdateCompanyOverrideRequestBodyValueType } from "../../types/UpdateCompanyOverrideRequestBodyValueType";

export const UpdateCompanyOverrideRequestBody: core.serialization.Schema<
    serializers.UpdateCompanyOverrideRequestBody.Raw,
    Schematic.UpdateCompanyOverrideRequestBody
> = core.serialization.object({
    expirationDate: core.serialization.property("expiration_date", core.serialization.date().optional()),
    metricPeriod: core.serialization.property("metric_period", UpdateCompanyOverrideRequestBodyMetricPeriod.optional()),
    metricPeriodMonthReset: core.serialization.property(
        "metric_period_month_reset",
        UpdateCompanyOverrideRequestBodyMetricPeriodMonthReset.optional()
    ),
    valueBool: core.serialization.property("value_bool", core.serialization.boolean().optional()),
    valueNumeric: core.serialization.property("value_numeric", core.serialization.number().optional()),
    valueTraitId: core.serialization.property("value_trait_id", core.serialization.string().optional()),
    valueType: core.serialization.property("value_type", UpdateCompanyOverrideRequestBodyValueType),
});

export declare namespace UpdateCompanyOverrideRequestBody {
    interface Raw {
        expiration_date?: string | null;
        metric_period?: UpdateCompanyOverrideRequestBodyMetricPeriod.Raw | null;
        metric_period_month_reset?: UpdateCompanyOverrideRequestBodyMetricPeriodMonthReset.Raw | null;
        value_bool?: boolean | null;
        value_numeric?: number | null;
        value_trait_id?: string | null;
        value_type: UpdateCompanyOverrideRequestBodyValueType.Raw;
    }
}
