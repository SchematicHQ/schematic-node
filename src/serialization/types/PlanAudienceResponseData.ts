/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const PlanAudienceResponseData: core.serialization.ObjectSchema<
    serializers.PlanAudienceResponseData.Raw,
    Schematic.PlanAudienceResponseData
> = core.serialization.object({
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    flagId: core.serialization.property("flag_id", core.serialization.string().optional()),
    id: core.serialization.string(),
    name: core.serialization.string(),
    planId: core.serialization.property("plan_id", core.serialization.string().optional()),
    priority: core.serialization.number(),
    ruleType: core.serialization.property("rule_type", core.serialization.string()),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
    value: core.serialization.boolean(),
});

export declare namespace PlanAudienceResponseData {
    export interface Raw {
        created_at: string;
        environment_id: string;
        flag_id?: string | null;
        id: string;
        name: string;
        plan_id?: string | null;
        priority: number;
        rule_type: string;
        updated_at: string;
        value: boolean;
    }
}
