/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const RuleConditionResourceResponseData: core.serialization.ObjectSchema<
    serializers.RuleConditionResourceResponseData.Raw,
    Schematic.RuleConditionResourceResponseData
> = core.serialization.object({
    id: core.serialization.string(),
    name: core.serialization.string(),
});

export declare namespace RuleConditionResourceResponseData {
    interface Raw {
        id: string;
        name: string;
    }
}
