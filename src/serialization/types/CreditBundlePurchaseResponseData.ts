/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { BillingCreditBundleResponseData } from "./BillingCreditBundleResponseData";

export const CreditBundlePurchaseResponseData: core.serialization.ObjectSchema<
    serializers.CreditBundlePurchaseResponseData.Raw,
    Schematic.CreditBundlePurchaseResponseData
> = core.serialization.object({
    bundle: BillingCreditBundleResponseData.optional(),
    quantity: core.serialization.number(),
    total: core.serialization.number(),
});

export declare namespace CreditBundlePurchaseResponseData {
    export interface Raw {
        bundle?: BillingCreditBundleResponseData.Raw | null;
        quantity: number;
        total: number;
    }
}
