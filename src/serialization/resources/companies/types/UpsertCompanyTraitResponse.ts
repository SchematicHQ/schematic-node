/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CompanyDetailResponseData } from "../../../types/CompanyDetailResponseData";

export const UpsertCompanyTraitResponse: core.serialization.ObjectSchema<
    serializers.UpsertCompanyTraitResponse.Raw,
    Schematic.UpsertCompanyTraitResponse
> = core.serialization.object({
    data: CompanyDetailResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpsertCompanyTraitResponse {
    export interface Raw {
        data: CompanyDetailResponseData.Raw;
        params: Record<string, unknown>;
    }
}
