/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CompanyDetailResponseData } from "../../../types/CompanyDetailResponseData";
import { LookupCompanyParams } from "./LookupCompanyParams";

export const LookupCompanyResponse: core.serialization.ObjectSchema<
    serializers.LookupCompanyResponse.Raw,
    Schematic.LookupCompanyResponse
> = core.serialization.object({
    data: CompanyDetailResponseData,
    params: LookupCompanyParams,
});

export declare namespace LookupCompanyResponse {
    export interface Raw {
        data: CompanyDetailResponseData.Raw;
        params: LookupCompanyParams.Raw;
    }
}
