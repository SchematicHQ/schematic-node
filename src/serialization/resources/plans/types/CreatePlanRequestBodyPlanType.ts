/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CreatePlanRequestBodyPlanType: core.serialization.Schema<
    serializers.CreatePlanRequestBodyPlanType.Raw,
    Schematic.CreatePlanRequestBodyPlanType
> = core.serialization.enum_(["plan", "add_on"]);

export declare namespace CreatePlanRequestBodyPlanType {
    type Raw = "plan" | "add_on";
}
