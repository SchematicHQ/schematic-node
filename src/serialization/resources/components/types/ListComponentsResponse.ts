/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { ComponentResponseData } from "../../../types/ComponentResponseData";
import { ListComponentsParams } from "./ListComponentsParams";

export const ListComponentsResponse: core.serialization.ObjectSchema<
    serializers.ListComponentsResponse.Raw,
    Schematic.ListComponentsResponse
> = core.serialization.object({
    data: core.serialization.list(ComponentResponseData),
    params: ListComponentsParams,
});

export declare namespace ListComponentsResponse {
    export interface Raw {
        data: ComponentResponseData.Raw[];
        params: ListComponentsParams.Raw;
    }
}
