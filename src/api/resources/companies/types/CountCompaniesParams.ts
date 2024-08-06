/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * Input parameters
 */
export interface CountCompaniesParams {
    ids?: string[];
    /** Page limit (default 100) */
    limit?: number;
    /** Page offset (default 0) */
    offset?: number;
    planId?: string;
    /** Search filter */
    q?: string;
    /** Filter out companies that already have a company override for the specified feature ID */
    withoutFeatureOverrideFor?: string;
}
