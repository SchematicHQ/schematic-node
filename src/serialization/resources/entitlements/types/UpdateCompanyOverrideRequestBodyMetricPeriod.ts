/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const UpdateCompanyOverrideRequestBodyMetricPeriod: core.serialization.Schema<
    serializers.UpdateCompanyOverrideRequestBodyMetricPeriod.Raw,
    Schematic.UpdateCompanyOverrideRequestBodyMetricPeriod
> = core.serialization.enum_(["all_time", "current_month", "current_week", "current_day"]);

export declare namespace UpdateCompanyOverrideRequestBodyMetricPeriod {
    export type Raw = "all_time" | "current_month" | "current_week" | "current_day";
}
