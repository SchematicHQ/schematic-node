/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const SearchBillingPricesRequestTiersMode: core.serialization.Schema<
    serializers.SearchBillingPricesRequestTiersMode.Raw,
    Schematic.SearchBillingPricesRequestTiersMode
> = core.serialization.enum_(["volume", "graduated"]);

export declare namespace SearchBillingPricesRequestTiersMode {
    export type Raw = "volume" | "graduated";
}
