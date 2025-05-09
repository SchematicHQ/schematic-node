/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { PlanDetailResponseData } from "../../../types/PlanDetailResponseData";
import { ListPlansParams } from "./ListPlansParams";

export const ListPlansResponse: core.serialization.ObjectSchema<
    serializers.ListPlansResponse.Raw,
    Schematic.ListPlansResponse
> = core.serialization.object({
    data: core.serialization.list(PlanDetailResponseData),
    params: ListPlansParams,
});

export declare namespace ListPlansResponse {
    export interface Raw {
        data: PlanDetailResponseData.Raw[];
        params: ListPlansParams.Raw;
    }
}
