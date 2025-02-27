/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {
 *         amount: "amount",
 *         interval: "interval",
 *         lineItemExternalId: "line_item_external_id",
 *         productExternalId: "product_external_id",
 *         quantity: 1
 *     }
 */
export interface CreateCrmLineItemRequestBody {
    amount: string;
    discountPercentage?: string;
    interval: string;
    lineItemExternalId: string;
    productExternalId: string;
    quantity: number;
    termMonth?: number;
    totalDiscount?: string;
}
