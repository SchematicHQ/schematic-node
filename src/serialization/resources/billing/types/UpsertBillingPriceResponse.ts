/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { BillingPriceResponseData } from "../../../types/BillingPriceResponseData";

export const UpsertBillingPriceResponse: core.serialization.ObjectSchema<
    serializers.UpsertBillingPriceResponse.Raw,
    Schematic.UpsertBillingPriceResponse
> = core.serialization.object({
    data: BillingPriceResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpsertBillingPriceResponse {
    interface Raw {
        data: BillingPriceResponseData.Raw;
        params: Record<string, unknown>;
    }
}
