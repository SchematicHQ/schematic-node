/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * Input parameters
 */
export interface CountBillingProductsParams {
    ids?: string[];
    /** Page limit (default 100) */
    limit?: number;
    name?: string;
    /** Page offset (default 0) */
    offset?: number;
    q?: string;
    /** Filter products that are not linked to any plan */
    withoutLinkedToPlan?: boolean;
}