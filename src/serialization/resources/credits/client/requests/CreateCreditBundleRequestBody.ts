/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { CreateCreditBundleRequestBodyExpiryType } from "../../types/CreateCreditBundleRequestBodyExpiryType";
import { CreateCreditBundleRequestBodyStatus } from "../../types/CreateCreditBundleRequestBodyStatus";

export const CreateCreditBundleRequestBody: core.serialization.Schema<
    serializers.CreateCreditBundleRequestBody.Raw,
    Schematic.CreateCreditBundleRequestBody
> = core.serialization.object({
    bundleType: core.serialization.property("bundle_type", core.serialization.stringLiteral("fixed").optional()),
    creditId: core.serialization.property("credit_id", core.serialization.string()),
    currency: core.serialization.string(),
    expiryType: core.serialization.property("expiry_type", CreateCreditBundleRequestBodyExpiryType.optional()),
    expiryUnit: core.serialization.property("expiry_unit", core.serialization.stringLiteral("days").optional()),
    expiryUnitCount: core.serialization.property("expiry_unit_count", core.serialization.number().optional()),
    pricePerUnit: core.serialization.property("price_per_unit", core.serialization.number()),
    pricePerUnitDecimal: core.serialization.property("price_per_unit_decimal", core.serialization.string().optional()),
    quantity: core.serialization.number().optional(),
    status: CreateCreditBundleRequestBodyStatus.optional(),
});

export declare namespace CreateCreditBundleRequestBody {
    export interface Raw {
        bundle_type?: "fixed" | null;
        credit_id: string;
        currency: string;
        expiry_type?: CreateCreditBundleRequestBodyExpiryType.Raw | null;
        expiry_unit?: "days" | null;
        expiry_unit_count?: number | null;
        price_per_unit: number;
        price_per_unit_decimal?: string | null;
        quantity?: number | null;
        status?: CreateCreditBundleRequestBodyStatus.Raw | null;
    }
}
