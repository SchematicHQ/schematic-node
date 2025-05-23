/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const InvoiceRequestBody: core.serialization.ObjectSchema<
    serializers.InvoiceRequestBody.Raw,
    Schematic.InvoiceRequestBody
> = core.serialization.object({
    amountDue: core.serialization.property("amount_due", core.serialization.number()),
    amountPaid: core.serialization.property("amount_paid", core.serialization.number()),
    amountRemaining: core.serialization.property("amount_remaining", core.serialization.number()),
    collectionMethod: core.serialization.property("collection_method", core.serialization.string()),
    currency: core.serialization.string(),
    customerExternalId: core.serialization.property("customer_external_id", core.serialization.string()),
    dueDate: core.serialization.property("due_date", core.serialization.date().optional()),
    paymentMethodExternalId: core.serialization.property(
        "payment_method_external_id",
        core.serialization.string().optional(),
    ),
    subscriptionExternalId: core.serialization.property(
        "subscription_external_id",
        core.serialization.string().optional(),
    ),
    subtotal: core.serialization.number(),
    url: core.serialization.string().optional(),
});

export declare namespace InvoiceRequestBody {
    export interface Raw {
        amount_due: number;
        amount_paid: number;
        amount_remaining: number;
        collection_method: string;
        currency: string;
        customer_external_id: string;
        due_date?: string | null;
        payment_method_external_id?: string | null;
        subscription_external_id?: string | null;
        subtotal: number;
        url?: string | null;
    }
}
