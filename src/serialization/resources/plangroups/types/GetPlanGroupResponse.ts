/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { PlanGroupDetailResponseData } from "../../../types/PlanGroupDetailResponseData";

export const GetPlanGroupResponse: core.serialization.ObjectSchema<
    serializers.GetPlanGroupResponse.Raw,
    Schematic.GetPlanGroupResponse
> = core.serialization.object({
    data: PlanGroupDetailResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace GetPlanGroupResponse {
    interface Raw {
        data: PlanGroupDetailResponseData.Raw;
        params: Record<string, unknown>;
    }
}