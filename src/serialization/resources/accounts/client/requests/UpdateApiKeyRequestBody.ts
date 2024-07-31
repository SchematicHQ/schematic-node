/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";

export const UpdateApiKeyRequestBody: core.serialization.Schema<
    serializers.UpdateApiKeyRequestBody.Raw,
    Schematic.UpdateApiKeyRequestBody
> = core.serialization.object({
    description: core.serialization.string().optional(),
    name: core.serialization.string().optional(),
});

export declare namespace UpdateApiKeyRequestBody {
    interface Raw {
        description?: string | null;
        name?: string | null;
    }
}
