/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { ApiKeyRequestResponseData } from "../../../types/ApiKeyRequestResponseData";

export const GetApiRequestResponse: core.serialization.ObjectSchema<
    serializers.GetApiRequestResponse.Raw,
    Schematic.GetApiRequestResponse
> = core.serialization.object({
    data: ApiKeyRequestResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace GetApiRequestResponse {
    export interface Raw {
        data: ApiKeyRequestResponseData.Raw;
        params: Record<string, unknown>;
    }
}
