/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { BillingPriceResponseData } from "../../../types/BillingPriceResponseData";
import { ListProductPricesParams } from "./ListProductPricesParams";

export const ListProductPricesResponse: core.serialization.ObjectSchema<
    serializers.ListProductPricesResponse.Raw,
    Schematic.ListProductPricesResponse
> = core.serialization.object({
    data: core.serialization.list(BillingPriceResponseData),
    params: ListProductPricesParams,
});

export declare namespace ListProductPricesResponse {
    interface Raw {
        data: BillingPriceResponseData.Raw[];
        params: ListProductPricesParams.Raw;
    }
}
