/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {}
 */
export interface ListPlanEntitlementsRequest {
    /**
     * Filter plan entitlements by a single feature ID (starting with feat_)
     */
    featureId?: string;
    /**
     * Filter plan entitlements by multiple feature IDs (starting with feat_)
     */
    featureIds?: string | string[];
    /**
     * Filter plan entitlements by multiple plan entitlement IDs (starting with pltl_)
     */
    ids?: string | string[];
    /**
     * Filter plan entitlements by a single plan ID (starting with plan_)
     */
    planId?: string;
    /**
     * Filter plan entitlements by multiple plan IDs (starting with plan_)
     */
    planIds?: string | string[];
    /**
     * Search for plan entitlements by feature or company name
     */
    q?: string;
    /**
     * Filter plan entitlements only with metered products
     */
    withMeteredProducts?: boolean;
    /**
     * Page limit (default 100)
     */
    limit?: number;
    /**
     * Page offset (default 0)
     */
    offset?: number;
}
