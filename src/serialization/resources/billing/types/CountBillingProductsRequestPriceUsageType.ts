/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CountBillingProductsRequestPriceUsageType: core.serialization.Schema<
    serializers.CountBillingProductsRequestPriceUsageType.Raw,
    Schematic.CountBillingProductsRequestPriceUsageType
> = core.serialization.enum_(["licensed", "metered"]);

export declare namespace CountBillingProductsRequestPriceUsageType {
    type Raw = "licensed" | "metered";
}
