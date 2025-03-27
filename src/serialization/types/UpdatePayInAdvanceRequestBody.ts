/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const UpdatePayInAdvanceRequestBody: core.serialization.ObjectSchema<
    serializers.UpdatePayInAdvanceRequestBody.Raw,
    Schematic.UpdatePayInAdvanceRequestBody
> = core.serialization.object({
    priceId: core.serialization.property("price_id", core.serialization.string()),
    quantity: core.serialization.number(),
});

export declare namespace UpdatePayInAdvanceRequestBody {
    export interface Raw {
        price_id: string;
        quantity: number;
    }
}
