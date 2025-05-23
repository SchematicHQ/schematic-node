/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { PlanEntitlementResponseData } from "../../../types/PlanEntitlementResponseData";
import { ListPlanEntitlementsParams } from "./ListPlanEntitlementsParams";

export const ListPlanEntitlementsResponse: core.serialization.ObjectSchema<
    serializers.ListPlanEntitlementsResponse.Raw,
    Schematic.ListPlanEntitlementsResponse
> = core.serialization.object({
    data: core.serialization.list(PlanEntitlementResponseData),
    params: ListPlanEntitlementsParams,
});

export declare namespace ListPlanEntitlementsResponse {
    export interface Raw {
        data: PlanEntitlementResponseData.Raw[];
        params: ListPlanEntitlementsParams.Raw;
    }
}
