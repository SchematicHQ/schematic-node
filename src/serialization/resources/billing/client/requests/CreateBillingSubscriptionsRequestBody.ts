/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { BillingProductPricing } from "../../../../types/BillingProductPricing";

export const CreateBillingSubscriptionsRequestBody: core.serialization.Schema<
    serializers.CreateBillingSubscriptionsRequestBody.Raw,
    Schematic.CreateBillingSubscriptionsRequestBody
> = core.serialization.object({
    customerExternalId: core.serialization.property("customer_external_id", core.serialization.string()),
    expiredAt: core.serialization.property("expired_at", core.serialization.date()),
    interval: core.serialization.string().optional(),
    productExternalIds: core.serialization.property(
        "product_external_ids",
        core.serialization.list(BillingProductPricing)
    ),
    subscriptionExternalId: core.serialization.property("subscription_external_id", core.serialization.string()),
    totalPrice: core.serialization.property("total_price", core.serialization.number()),
});

export declare namespace CreateBillingSubscriptionsRequestBody {
    interface Raw {
        customer_external_id: string;
        expired_at: string;
        interval?: string | null;
        product_external_ids: BillingProductPricing.Raw[];
        subscription_external_id: string;
        total_price: number;
    }
}
