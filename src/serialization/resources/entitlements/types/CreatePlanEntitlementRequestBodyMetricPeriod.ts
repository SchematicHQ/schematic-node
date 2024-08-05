/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CreatePlanEntitlementRequestBodyMetricPeriod: core.serialization.Schema<
  serializers.CreatePlanEntitlementRequestBodyMetricPeriod.Raw,
  Schematic.CreatePlanEntitlementRequestBodyMetricPeriod
> = core.serialization.enum_(["current_month", "current_week", "current_day"]);

export declare namespace CreatePlanEntitlementRequestBodyMetricPeriod {
  type Raw = "current_month" | "current_week" | "current_day";
}
