/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CountPlansRequestPlanType: core.serialization.Schema<
    serializers.CountPlansRequestPlanType.Raw,
    Schematic.CountPlansRequestPlanType
> = core.serialization.enum_(["plan", "add_on"]);

export declare namespace CountPlansRequestPlanType {
    type Raw = "plan" | "add_on";
}
