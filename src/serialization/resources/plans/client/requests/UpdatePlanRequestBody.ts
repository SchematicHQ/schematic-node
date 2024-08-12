/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";

export const UpdatePlanRequestBody: core.serialization.Schema<
    serializers.UpdatePlanRequestBody.Raw,
    Schematic.UpdatePlanRequestBody
> = core.serialization.object({
    description: core.serialization.string().optional(),
    icon: core.serialization.string().optional(),
    name: core.serialization.string(),
});

export declare namespace UpdatePlanRequestBody {
    interface Raw {
        description?: string | null;
        icon?: string | null;
        name: string;
    }
}
