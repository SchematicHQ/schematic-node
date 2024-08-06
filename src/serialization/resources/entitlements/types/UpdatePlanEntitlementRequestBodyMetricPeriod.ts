/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const UpdatePlanEntitlementRequestBodyMetricPeriod: core.serialization.Schema<
  serializers.UpdatePlanEntitlementRequestBodyMetricPeriod.Raw,
  Schematic.UpdatePlanEntitlementRequestBodyMetricPeriod
> = core.serialization.enum_(["current_month", "current_week", "current_day"]);

export declare namespace UpdatePlanEntitlementRequestBodyMetricPeriod {
  type Raw = "current_month" | "current_week" | "current_day";
}
