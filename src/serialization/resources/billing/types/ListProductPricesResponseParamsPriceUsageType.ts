/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const ListProductPricesResponseParamsPriceUsageType: core.serialization.Schema<
    serializers.ListProductPricesResponseParamsPriceUsageType.Raw,
    Schematic.ListProductPricesResponseParamsPriceUsageType
> = core.serialization.enum_(["licensed", "metered"]);

export declare namespace ListProductPricesResponseParamsPriceUsageType {
    type Raw = "licensed" | "metered";
}
