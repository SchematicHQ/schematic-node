/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const BillingSubscriptionResponseData: core.serialization.ObjectSchema<
    serializers.BillingSubscriptionResponseData.Raw,
    Schematic.BillingSubscriptionResponseData
> = core.serialization.object({
    currency: core.serialization.string(),
    expiredAt: core.serialization.property("expired_at", core.serialization.date().optional()),
    externalId: core.serialization.property("external_id", core.serialization.string()),
    id: core.serialization.string(),
    interval: core.serialization.string(),
    totalPrice: core.serialization.property("total_price", core.serialization.number()),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
});

export declare namespace BillingSubscriptionResponseData {
    interface Raw {
        currency: string;
        expired_at?: string | null;
        external_id: string;
        id: string;
        interval: string;
        total_price: number;
        updated_at: string;
    }
}
