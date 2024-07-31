/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { ApiKeyCreateResponseData } from "../../../types/ApiKeyCreateResponseData";

export const CreateApiKeyResponse: core.serialization.ObjectSchema<
    serializers.CreateApiKeyResponse.Raw,
    Schematic.CreateApiKeyResponse
> = core.serialization.object({
    data: ApiKeyCreateResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace CreateApiKeyResponse {
    interface Raw {
        data: ApiKeyCreateResponseData.Raw;
        params: Record<string, unknown>;
    }
}
