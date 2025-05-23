/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface BillingProductForSubscriptionResponseData {
    billingScheme: string;
    createdAt: Date;
    currency: string;
    environmentId: string;
    externalId: string;
    id: string;
    interval: string;
    meterId?: string;
    name: string;
    packageSize: number;
    price: number;
    priceDecimal?: string;
    priceExternalId: string;
    priceId: string;
    priceTier: Schematic.BillingProductPriceTierResponseData[];
    quantity: number;
    subscriptionId: string;
    updatedAt: Date;
    usageType: string;
}
