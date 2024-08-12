/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";

export const ChangeSubscriptionRequestBody: core.serialization.Schema<
    serializers.ChangeSubscriptionRequestBody.Raw,
    Schematic.ChangeSubscriptionRequestBody
> = core.serialization.object({
    action: core.serialization.string(),
    newPlanId: core.serialization.property("new_plan_id", core.serialization.string()),
    newPriceId: core.serialization.property("new_price_id", core.serialization.string()),
});

export declare namespace ChangeSubscriptionRequestBody {
    interface Raw {
        action: string;
        new_plan_id: string;
        new_price_id: string;
    }
}