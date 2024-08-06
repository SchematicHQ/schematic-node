/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { ComponentResponseData } from "../../../types/ComponentResponseData";

export const UpdateComponentResponse: core.serialization.ObjectSchema<
    serializers.UpdateComponentResponse.Raw,
    Schematic.UpdateComponentResponse
> = core.serialization.object({
    data: ComponentResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpdateComponentResponse {
    interface Raw {
        data: ComponentResponseData.Raw;
        params: Record<string, unknown>;
    }
}
