/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {
 *         billingProductId: "billing_product_id"
 *     }
 */
export interface UpsertBillingProductRequestBody {
  billingProductId: string;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
}
