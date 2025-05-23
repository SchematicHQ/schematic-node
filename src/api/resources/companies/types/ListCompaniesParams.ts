/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * Input parameters
 */
export interface ListCompaniesParams {
    /** Filter companies by multiple company IDs (starts with comp_) */
    ids?: string[];
    /** Page limit (default 100) */
    limit?: number;
    /** Page offset (default 0) */
    offset?: number;
    /** Filter companies by plan ID (starts with plan_) */
    planId?: string;
    /** Search for companies by name, keys or string traits */
    q?: string;
    /** Filter companies that have a subscription */
    withSubscription?: boolean;
    /** Filter out companies that already have a company override for the specified feature ID */
    withoutFeatureOverrideFor?: string;
    /** Filter out companies that have a plan */
    withoutPlan?: boolean;
}
