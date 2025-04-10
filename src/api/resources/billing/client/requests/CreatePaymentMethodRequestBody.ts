/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {
 *         customerExternalId: "customer_external_id",
 *         externalId: "external_id",
 *         paymentMethodType: "payment_method_type"
 *     }
 */
export interface CreatePaymentMethodRequestBody {
    accountLast4?: string;
    accountName?: string;
    bankName?: string;
    billingEmail?: string;
    billingName?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    cardLast4?: string;
    customerExternalId: string;
    externalId: string;
    paymentMethodType: string;
}
