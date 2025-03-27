/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const BillingProductPriceResponseData: core.serialization.ObjectSchema<
    serializers.BillingProductPriceResponseData.Raw,
    Schematic.BillingProductPriceResponseData
> = core.serialization.object({
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    currency: core.serialization.string(),
    id: core.serialization.string(),
    interval: core.serialization.string(),
    isActive: core.serialization.property("is_active", core.serialization.boolean()),
    meterId: core.serialization.property("meter_id", core.serialization.string().optional()),
    price: core.serialization.number(),
    priceExternalId: core.serialization.property("price_external_id", core.serialization.string()),
    productExternalId: core.serialization.property("product_external_id", core.serialization.string()),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
    usageType: core.serialization.property("usage_type", core.serialization.string()),
});

export declare namespace BillingProductPriceResponseData {
    export interface Raw {
        created_at: string;
        currency: string;
        id: string;
        interval: string;
        is_active: boolean;
        meter_id?: string | null;
        price: number;
        price_external_id: string;
        product_external_id: string;
        updated_at: string;
        usage_type: string;
    }
}
