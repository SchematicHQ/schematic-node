/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const BillingPriceResponseData: core.serialization.ObjectSchema<
    serializers.BillingPriceResponseData.Raw,
    Schematic.BillingPriceResponseData
> = core.serialization.object({
    externalPriceId: core.serialization.property("external_price_id", core.serialization.string()),
    id: core.serialization.string(),
    interval: core.serialization.string(),
    price: core.serialization.number(),
});

export declare namespace BillingPriceResponseData {
    interface Raw {
        external_price_id: string;
        id: string;
        interval: string;
        price: number;
    }
}
