/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { FlagResponseData } from "./FlagResponseData";
import { RuleDetailResponseData } from "./RuleDetailResponseData";

export const RulesDetailResponseData: core.serialization.ObjectSchema<
    serializers.RulesDetailResponseData.Raw,
    Schematic.RulesDetailResponseData
> = core.serialization.object({
    flag: FlagResponseData.optional(),
    rules: core.serialization.list(RuleDetailResponseData),
});

export declare namespace RulesDetailResponseData {
    export interface Raw {
        flag?: FlagResponseData.Raw | null;
        rules: RuleDetailResponseData.Raw[];
    }
}
