/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { CreatePlanRequestBodyPlanType } from "../../types/CreatePlanRequestBodyPlanType";

export const CreatePlanRequestBody: core.serialization.Schema<
    serializers.CreatePlanRequestBody.Raw,
    Schematic.CreatePlanRequestBody
> = core.serialization.object({
    audienceType: core.serialization.property("audience_type", core.serialization.string().optional()),
    description: core.serialization.string(),
    icon: core.serialization.string().optional(),
    name: core.serialization.string(),
    planType: core.serialization.property("plan_type", CreatePlanRequestBodyPlanType),
});

export declare namespace CreatePlanRequestBody {
    interface Raw {
        audience_type?: string | null;
        description: string;
        icon?: string | null;
        name: string;
        plan_type: CreatePlanRequestBodyPlanType.Raw;
    }
}
