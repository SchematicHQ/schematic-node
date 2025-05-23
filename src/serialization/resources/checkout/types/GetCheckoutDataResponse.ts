/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CheckoutDataResponseData } from "../../../types/CheckoutDataResponseData";

export const GetCheckoutDataResponse: core.serialization.ObjectSchema<
    serializers.GetCheckoutDataResponse.Raw,
    Schematic.GetCheckoutDataResponse
> = core.serialization.object({
    data: CheckoutDataResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace GetCheckoutDataResponse {
    export interface Raw {
        data: CheckoutDataResponseData.Raw;
        params: Record<string, unknown>;
    }
}
