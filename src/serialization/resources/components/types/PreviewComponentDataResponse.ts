/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { ComponentPreviewResponseData } from "../../../types/ComponentPreviewResponseData";
import { PreviewComponentDataParams } from "./PreviewComponentDataParams";

export const PreviewComponentDataResponse: core.serialization.ObjectSchema<
    serializers.PreviewComponentDataResponse.Raw,
    Schematic.PreviewComponentDataResponse
> = core.serialization.object({
    data: ComponentPreviewResponseData,
    params: PreviewComponentDataParams,
});

export declare namespace PreviewComponentDataResponse {
    interface Raw {
        data: ComponentPreviewResponseData.Raw;
        params: PreviewComponentDataParams.Raw;
    }
}