/**
 * This file was auto-generated by Fern from our API Definition.
 */

export interface InvoiceResponseData {
    amountDue: number;
    amountPaid: number;
    amountRemaining: number;
    collectionMethod: string;
    companyId?: string;
    createdAt: Date;
    currency: string;
    customerExternalId: string;
    dueDate?: Date;
    environmentId: string;
    externalId?: string;
    id: string;
    paymentMethodExternalId?: string;
    subscriptionExternalId?: string;
    subtotal: number;
    updatedAt: Date;
    url?: string;
}
