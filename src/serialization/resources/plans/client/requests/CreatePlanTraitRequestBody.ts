/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";

export const CreatePlanTraitRequestBody: core.serialization.Schema<
    serializers.CreatePlanTraitRequestBody.Raw,
    Schematic.CreatePlanTraitRequestBody
> = core.serialization.object({
    planId: core.serialization.property("plan_id", core.serialization.string()),
    traitId: core.serialization.property("trait_id", core.serialization.string()),
    traitValue: core.serialization.property("trait_value", core.serialization.string()),
});

export declare namespace CreatePlanTraitRequestBody {
    export interface Raw {
        plan_id: string;
        trait_id: string;
        trait_value: string;
    }
}
