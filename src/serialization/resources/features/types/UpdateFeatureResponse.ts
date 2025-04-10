/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { FeatureDetailResponseData } from "../../../types/FeatureDetailResponseData";

export const UpdateFeatureResponse: core.serialization.ObjectSchema<
    serializers.UpdateFeatureResponse.Raw,
    Schematic.UpdateFeatureResponse
> = core.serialization.object({
    data: FeatureDetailResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpdateFeatureResponse {
    export interface Raw {
        data: FeatureDetailResponseData.Raw;
        params: Record<string, unknown>;
    }
}
