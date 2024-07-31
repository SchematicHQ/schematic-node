/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { UpdateCompanyOverrideRequestBodyMetricPeriod } from "../../types/UpdateCompanyOverrideRequestBodyMetricPeriod";
import { UpdateCompanyOverrideRequestBodyValueType } from "../../types/UpdateCompanyOverrideRequestBodyValueType";

export const UpdateCompanyOverrideRequestBody: core.serialization.Schema<
    serializers.UpdateCompanyOverrideRequestBody.Raw,
    Schematic.UpdateCompanyOverrideRequestBody
> = core.serialization.object({
    metricPeriod: core.serialization.property("metric_period", UpdateCompanyOverrideRequestBodyMetricPeriod.optional()),
    valueBool: core.serialization.property("value_bool", core.serialization.boolean().optional()),
    valueNumeric: core.serialization.property("value_numeric", core.serialization.number().optional()),
    valueTraitId: core.serialization.property("value_trait_id", core.serialization.string().optional()),
    valueType: core.serialization.property("value_type", UpdateCompanyOverrideRequestBodyValueType),
});

export declare namespace UpdateCompanyOverrideRequestBody {
    interface Raw {
        metric_period?: UpdateCompanyOverrideRequestBodyMetricPeriod.Raw | null;
        value_bool?: boolean | null;
        value_numeric?: number | null;
        value_trait_id?: string | null;
        value_type: UpdateCompanyOverrideRequestBodyValueType.Raw;
    }
}
