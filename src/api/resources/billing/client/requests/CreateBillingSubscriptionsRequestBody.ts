/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../../index";

/**
 * @example
 *     {
 *         customerExternalId: "customer_external_id",
 *         expiredAt: new Date("2024-01-15T09:30:00.000Z"),
 *         productExternalIds: [{
 *                 price: 1,
 *                 productExternalId: "product_external_id"
 *             }],
 *         subscriptionExternalId: "subscription_external_id",
 *         totalPrice: 1
 *     }
 */
export interface CreateBillingSubscriptionsRequestBody {
    customerExternalId: string;
    expiredAt: Date;
    interval?: string;
    productExternalIds: Schematic.BillingProductPricing[];
    subscriptionExternalId: string;
    totalPrice: number;
}
