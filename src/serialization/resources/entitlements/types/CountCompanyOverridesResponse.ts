/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CountResponse } from "../../../types/CountResponse";
import { CountCompanyOverridesParams } from "./CountCompanyOverridesParams";

export const CountCompanyOverridesResponse: core.serialization.ObjectSchema<
    serializers.CountCompanyOverridesResponse.Raw,
    Schematic.CountCompanyOverridesResponse
> = core.serialization.object({
    data: CountResponse,
    params: CountCompanyOverridesParams,
});

export declare namespace CountCompanyOverridesResponse {
    interface Raw {
        data: CountResponse.Raw;
        params: CountCompanyOverridesParams.Raw;
    }
}
