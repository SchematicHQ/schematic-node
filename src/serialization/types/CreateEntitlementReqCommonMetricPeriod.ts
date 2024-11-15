/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const CreateEntitlementReqCommonMetricPeriod: core.serialization.Schema<
    serializers.CreateEntitlementReqCommonMetricPeriod.Raw,
    Schematic.CreateEntitlementReqCommonMetricPeriod
> = core.serialization.enum_(["all_time", "billing", "current_month", "current_week", "current_day"]);

export declare namespace CreateEntitlementReqCommonMetricPeriod {
    type Raw = "all_time" | "billing" | "current_month" | "current_week" | "current_day";
}
