/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const UpdateReqCommonMetricPeriod: core.serialization.Schema<
    serializers.UpdateReqCommonMetricPeriod.Raw,
    Schematic.UpdateReqCommonMetricPeriod
> = core.serialization.enum_(["billing", "current_month", "current_week", "current_day"]);

export declare namespace UpdateReqCommonMetricPeriod {
    type Raw = "billing" | "current_month" | "current_week" | "current_day";
}
