/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const CheckFlagRequestBody: core.serialization.ObjectSchema<
    serializers.CheckFlagRequestBody.Raw,
    Schematic.CheckFlagRequestBody
> = core.serialization.object({
    company: core.serialization.record(core.serialization.string(), core.serialization.string()).optional(),
    user: core.serialization.record(core.serialization.string(), core.serialization.string()).optional(),
});

export declare namespace CheckFlagRequestBody {
    export interface Raw {
        company?: Record<string, string> | null;
        user?: Record<string, string> | null;
    }
}
