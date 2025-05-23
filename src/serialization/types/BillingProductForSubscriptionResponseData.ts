/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { BillingProductPriceTierResponseData } from "./BillingProductPriceTierResponseData";

export const BillingProductForSubscriptionResponseData: core.serialization.ObjectSchema<
    serializers.BillingProductForSubscriptionResponseData.Raw,
    Schematic.BillingProductForSubscriptionResponseData
> = core.serialization.object({
    billingScheme: core.serialization.property("billing_scheme", core.serialization.string()),
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    currency: core.serialization.string(),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    externalId: core.serialization.property("external_id", core.serialization.string()),
    id: core.serialization.string(),
    interval: core.serialization.string(),
    meterId: core.serialization.property("meter_id", core.serialization.string().optional()),
    name: core.serialization.string(),
    packageSize: core.serialization.property("package_size", core.serialization.number()),
    price: core.serialization.number(),
    priceDecimal: core.serialization.property("price_decimal", core.serialization.string().optional()),
    priceExternalId: core.serialization.property("price_external_id", core.serialization.string()),
    priceId: core.serialization.property("price_id", core.serialization.string()),
    priceTier: core.serialization.property("price_tier", core.serialization.list(BillingProductPriceTierResponseData)),
    quantity: core.serialization.number(),
    subscriptionId: core.serialization.property("subscription_id", core.serialization.string()),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
    usageType: core.serialization.property("usage_type", core.serialization.string()),
});

export declare namespace BillingProductForSubscriptionResponseData {
    export interface Raw {
        billing_scheme: string;
        created_at: string;
        currency: string;
        environment_id: string;
        external_id: string;
        id: string;
        interval: string;
        meter_id?: string | null;
        name: string;
        package_size: number;
        price: number;
        price_decimal?: string | null;
        price_external_id: string;
        price_id: string;
        price_tier: BillingProductPriceTierResponseData.Raw[];
        quantity: number;
        subscription_id: string;
        updated_at: string;
        usage_type: string;
    }
}
