/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {
 *         amountDue: 1,
 *         amountPaid: 1,
 *         amountRemaining: 1,
 *         collectionMethod: "collection_method",
 *         currency: "currency",
 *         customerExternalId: "customer_external_id",
 *         subtotal: 1
 *     }
 */
export interface CreateInvoiceRequestBody {
    amountDue: number;
    amountPaid: number;
    amountRemaining: number;
    collectionMethod: string;
    currency: string;
    customerExternalId: string;
    dueDate?: Date;
    externalId?: string;
    paymentMethodExternalId?: string;
    subscriptionExternalId?: string;
    subtotal: number;
    url?: string;
}