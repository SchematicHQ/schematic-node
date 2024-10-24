/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const BillingProductForSubscriptionResponseData: core.serialization.ObjectSchema<
    serializers.BillingProductForSubscriptionResponseData.Raw,
    Schematic.BillingProductForSubscriptionResponseData
> = core.serialization.object({
    accountId: core.serialization.property("account_id", core.serialization.string()),
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    currency: core.serialization.string(),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    externalId: core.serialization.property("external_id", core.serialization.string()),
    id: core.serialization.string(),
    interval: core.serialization.string(),
    name: core.serialization.string(),
    price: core.serialization.number(),
    priceExternalId: core.serialization.property("price_external_id", core.serialization.string()),
    quantity: core.serialization.number(),
    subscriptionId: core.serialization.property("subscription_id", core.serialization.string()),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
});

export declare namespace BillingProductForSubscriptionResponseData {
    interface Raw {
        account_id: string;
        created_at: string;
        currency: string;
        environment_id: string;
        external_id: string;
        id: string;
        interval: string;
        name: string;
        price: number;
        price_external_id: string;
        quantity: number;
        subscription_id: string;
        updated_at: string;
    }
}
