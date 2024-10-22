/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {}
 */
export interface ListBillingProductsRequest {
    ids?: string | string[];
    name?: string;
    q?: string;
    /**
     * Filter products that are not linked to any plan
     */
    withoutLinkedToPlan?: boolean;
    /**
     * Page limit (default 100)
     */
    limit?: number;
    /**
     * Page offset (default 0)
     */
    offset?: number;
}
