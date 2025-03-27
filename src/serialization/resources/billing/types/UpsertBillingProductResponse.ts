/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { BillingProductResponseData } from "../../../types/BillingProductResponseData";

export const UpsertBillingProductResponse: core.serialization.ObjectSchema<
    serializers.UpsertBillingProductResponse.Raw,
    Schematic.UpsertBillingProductResponse
> = core.serialization.object({
    data: BillingProductResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpsertBillingProductResponse {
    export interface Raw {
        data: BillingProductResponseData.Raw;
        params: Record<string, unknown>;
    }
}
