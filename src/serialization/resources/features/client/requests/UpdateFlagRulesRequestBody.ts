/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { CreateOrUpdateRuleRequestBody } from "../../../../types/CreateOrUpdateRuleRequestBody";

export const UpdateFlagRulesRequestBody: core.serialization.Schema<
    serializers.UpdateFlagRulesRequestBody.Raw,
    Schematic.UpdateFlagRulesRequestBody
> = core.serialization.object({
    rules: core.serialization.list(CreateOrUpdateRuleRequestBody),
});

export declare namespace UpdateFlagRulesRequestBody {
    interface Raw {
        rules: CreateOrUpdateRuleRequestBody.Raw[];
    }
}
