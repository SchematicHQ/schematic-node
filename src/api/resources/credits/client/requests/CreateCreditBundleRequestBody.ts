/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../../index";

/**
 * @example
 *     {
 *         creditId: "credit_id",
 *         currency: "currency",
 *         pricePerUnit: 1
 *     }
 */
export interface CreateCreditBundleRequestBody {
    bundleType?: "fixed";
    creditId: string;
    currency: string;
    expiryType?: Schematic.CreateCreditBundleRequestBodyExpiryType;
    expiryUnit?: "days";
    expiryUnitCount?: number;
    pricePerUnit: number;
    pricePerUnitDecimal?: string;
    quantity?: number;
    status?: Schematic.CreateCreditBundleRequestBodyStatus;
}
