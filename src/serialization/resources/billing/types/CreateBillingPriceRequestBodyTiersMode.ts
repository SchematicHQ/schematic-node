/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CreateBillingPriceRequestBodyTiersMode: core.serialization.Schema<
    serializers.CreateBillingPriceRequestBodyTiersMode.Raw,
    Schematic.CreateBillingPriceRequestBodyTiersMode
> = core.serialization.enum_(["volume", "graduated"]);

export declare namespace CreateBillingPriceRequestBodyTiersMode {
    export type Raw = "volume" | "graduated";
}
