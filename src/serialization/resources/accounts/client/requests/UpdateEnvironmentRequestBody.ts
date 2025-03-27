/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { UpdateEnvironmentRequestBodyEnvironmentType } from "../../types/UpdateEnvironmentRequestBodyEnvironmentType";

export const UpdateEnvironmentRequestBody: core.serialization.Schema<
    serializers.UpdateEnvironmentRequestBody.Raw,
    Schematic.UpdateEnvironmentRequestBody
> = core.serialization.object({
    environmentType: core.serialization.property(
        "environment_type",
        UpdateEnvironmentRequestBodyEnvironmentType.optional(),
    ),
    name: core.serialization.string().optional(),
});

export declare namespace UpdateEnvironmentRequestBody {
    export interface Raw {
        environment_type?: UpdateEnvironmentRequestBodyEnvironmentType.Raw | null;
        name?: string | null;
    }
}
