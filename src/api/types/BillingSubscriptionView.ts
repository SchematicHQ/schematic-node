/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

/**
 * The updated resource
 */
export interface BillingSubscriptionView {
    companyId?: string;
    createdAt: Date;
    currency: string;
    customerExternalId: string;
    discounts: Schematic.BillingSubscriptionDiscountView[];
    expiredAt?: Date;
    id: string;
    interval: string;
    latestInvoice?: Schematic.InvoiceResponseData;
    metadata?: Record<string, unknown>;
    paymentMethod?: Schematic.PaymentMethodResponseData;
    periodEnd: number;
    periodStart: number;
    products: Schematic.BillingProductForSubscriptionResponseData[];
    status: string;
    subscriptionExternalId: string;
    totalPrice: number;
    trialEnd?: number;
    trialEndSetting?: string;
}
