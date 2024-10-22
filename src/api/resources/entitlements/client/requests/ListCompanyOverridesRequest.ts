/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {}
 */
export interface ListCompanyOverridesRequest {
    /**
     * Filter company overrides by a single company ID (starting with comp\_)
     */
    companyId?: string;
    /**
     * Filter company overrides by multiple company IDs (starting with comp\_)
     */
    companyIds?: string | string[];
    /**
     * Filter company overrides by a single feature ID (starting with feat\_)
     */
    featureId?: string;
    /**
     * Filter company overrides by multiple feature IDs (starting with feat\_)
     */
    featureIds?: string | string[];
    /**
     * Filter company overrides by multiple company override IDs (starting with cmov\_)
     */
    ids?: string | string[];
    /**
     * Search for company overrides by feature or company name
     */
    q?: string;
    /**
     * Page limit (default 100)
     */
    limit?: number;
    /**
     * Page offset (default 0)
     */
    offset?: number;
}
