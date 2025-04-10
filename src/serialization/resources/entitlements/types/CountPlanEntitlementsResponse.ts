/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CountResponse } from "../../../types/CountResponse";
import { CountPlanEntitlementsParams } from "./CountPlanEntitlementsParams";

export const CountPlanEntitlementsResponse: core.serialization.ObjectSchema<
    serializers.CountPlanEntitlementsResponse.Raw,
    Schematic.CountPlanEntitlementsResponse
> = core.serialization.object({
    data: CountResponse,
    params: CountPlanEntitlementsParams,
});

export declare namespace CountPlanEntitlementsResponse {
    export interface Raw {
        data: CountResponse.Raw;
        params: CountPlanEntitlementsParams.Raw;
    }
}
