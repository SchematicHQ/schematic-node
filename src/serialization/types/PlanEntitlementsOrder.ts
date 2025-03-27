/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const PlanEntitlementsOrder: core.serialization.ObjectSchema<
    serializers.PlanEntitlementsOrder.Raw,
    Schematic.PlanEntitlementsOrder
> = core.serialization.object({
    planEntitlementId: core.serialization.property("plan_entitlement_id", core.serialization.string()),
    visible: core.serialization.boolean().optional(),
});

export declare namespace PlanEntitlementsOrder {
    export interface Raw {
        plan_entitlement_id: string;
        visible?: boolean | null;
    }
}
