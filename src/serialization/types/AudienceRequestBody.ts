/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { CreateOrUpdateConditionGroupRequestBody } from "./CreateOrUpdateConditionGroupRequestBody";
import { CreateOrUpdateConditionRequestBody } from "./CreateOrUpdateConditionRequestBody";

export const AudienceRequestBody: core.serialization.ObjectSchema<
    serializers.AudienceRequestBody.Raw,
    Schematic.AudienceRequestBody
> = core.serialization.object({
    conditionGroups: core.serialization.property(
        "condition_groups",
        core.serialization.list(CreateOrUpdateConditionGroupRequestBody)
    ),
    conditions: core.serialization.list(CreateOrUpdateConditionRequestBody),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
    q: core.serialization.string().optional(),
});

export declare namespace AudienceRequestBody {
    interface Raw {
        condition_groups: CreateOrUpdateConditionGroupRequestBody.Raw[];
        conditions: CreateOrUpdateConditionRequestBody.Raw[];
        limit?: number | null;
        offset?: number | null;
        q?: string | null;
    }
}
