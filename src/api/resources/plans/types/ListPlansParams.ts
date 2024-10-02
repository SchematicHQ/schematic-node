/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../index";

/**
 * Input parameters
 */
export interface ListPlansParams {
    companyId?: string;
    /** Filter out plans that do not have a billing product ID */
    hasProductId?: boolean;
    ids?: string[];
    /** Page limit (default 100) */
    limit?: number;
    /** Page offset (default 0) */
    offset?: number;
    /** Filter by plan type */
    planType?: Schematic.ListPlansResponseParamsPlanType;
    q?: string;
    /** Filter out plans that already have a plan entitlement for the specified feature ID */
    withoutEntitlementFor?: string;
}
