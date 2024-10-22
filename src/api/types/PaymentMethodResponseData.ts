/**
 * This file was auto-generated by Fern from our API Definition.
 */

export interface PaymentMethodResponseData {
    accountLast4?: string;
    accountName?: string;
    bankName?: string;
    billingEmail?: string;
    billingName?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    cardLast4?: string;
    companyId?: string;
    createdAt: Date;
    customerExternalId: string;
    environmentId: string;
    externalId: string;
    id: string;
    paymentMethodType: string;
    subscriptionExternalId?: string;
    updatedAt: Date;
}
