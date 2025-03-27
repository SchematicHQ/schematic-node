/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface CompanySubscriptionResponseData {
    cancelAt?: Date;
    cancelAtPeriodEnd: boolean;
    currency: string;
    customerExternalId: string;
    discounts: Schematic.BillingSubscriptionDiscountView[];
    expiredAt?: Date;
    interval: string;
    latestInvoice?: Schematic.InvoiceResponseData;
    paymentMethod?: Schematic.PaymentMethodResponseData;
    products: Schematic.BillingProductForSubscriptionResponseData[];
    status: string;
    subscriptionExternalId: string;
    totalPrice: number;
    trialEnd?: Date;
}
