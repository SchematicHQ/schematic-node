/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * Input parameters
 */
export interface CountCompanyOverridesParams {
    /** Filter company overrides by a single company ID (starting with comp\_) */
    companyId?: string;
    /** Filter company overrides by multiple company IDs (starting with comp\_) */
    companyIds?: string[];
    /** Filter company overrides by a single feature ID (starting with feat\_) */
    featureId?: string;
    /** Filter company overrides by multiple feature IDs (starting with feat\_) */
    featureIds?: string[];
    /** Filter company overrides by multiple company override IDs (starting with cmov\_) */
    ids?: string[];
    /** Page limit (default 100) */
    limit?: number;
    /** Page offset (default 0) */
    offset?: number;
    /** Search for company overrides by feature or company name */
    q?: string;
}
