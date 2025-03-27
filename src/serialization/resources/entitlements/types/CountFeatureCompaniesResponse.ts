/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CountResponse } from "../../../types/CountResponse";
import { CountFeatureCompaniesParams } from "./CountFeatureCompaniesParams";

export const CountFeatureCompaniesResponse: core.serialization.ObjectSchema<
    serializers.CountFeatureCompaniesResponse.Raw,
    Schematic.CountFeatureCompaniesResponse
> = core.serialization.object({
    data: CountResponse,
    params: CountFeatureCompaniesParams,
});

export declare namespace CountFeatureCompaniesResponse {
    export interface Raw {
        data: CountResponse.Raw;
        params: CountFeatureCompaniesParams.Raw;
    }
}
