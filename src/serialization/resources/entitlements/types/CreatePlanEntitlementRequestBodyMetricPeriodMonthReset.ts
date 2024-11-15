/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CreatePlanEntitlementRequestBodyMetricPeriodMonthReset: core.serialization.Schema<
    serializers.CreatePlanEntitlementRequestBodyMetricPeriodMonthReset.Raw,
    Schematic.CreatePlanEntitlementRequestBodyMetricPeriodMonthReset
> = core.serialization.enum_(["first_of_month", "billing_cycle"]);

export declare namespace CreatePlanEntitlementRequestBodyMetricPeriodMonthReset {
    type Raw = "first_of_month" | "billing_cycle";
}