/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * Input parameters
 */
export interface CountBillingPlanCreditGrantsParams {
    creditId?: string;
    ids?: string[];
    /** Page limit (default 100) */
    limit?: number;
    /** Page offset (default 0) */
    offset?: number;
    planId?: string;
}
