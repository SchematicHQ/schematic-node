/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../index";

/**
 * Input parameters
 */
export interface ListProductPricesParams {
    ids?: string[];
    /** Page limit (default 100) */
    limit?: number;
    name?: string;
    /** Page offset (default 0) */
    offset?: number;
    priceUsageType?: Schematic.ListProductPricesResponseParamsPriceUsageType;
    q?: string;
    /** Filter products that have prices */
    withPricesOnly?: boolean;
    /** Filter products that have zero price for free subscription type */
    withZeroPrice?: boolean;
    /** Filter products that are not linked to any plan */
    withoutLinkedToPlan?: boolean;
}
