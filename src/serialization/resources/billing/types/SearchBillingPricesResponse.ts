/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { BillingPriceView } from "../../../types/BillingPriceView";
import { SearchBillingPricesParams } from "./SearchBillingPricesParams";

export const SearchBillingPricesResponse: core.serialization.ObjectSchema<
    serializers.SearchBillingPricesResponse.Raw,
    Schematic.SearchBillingPricesResponse
> = core.serialization.object({
    data: core.serialization.list(BillingPriceView),
    params: SearchBillingPricesParams,
});

export declare namespace SearchBillingPricesResponse {
    export interface Raw {
        data: BillingPriceView.Raw[];
        params: SearchBillingPricesParams.Raw;
    }
}
