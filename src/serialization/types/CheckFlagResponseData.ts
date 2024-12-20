/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const CheckFlagResponseData: core.serialization.ObjectSchema<
    serializers.CheckFlagResponseData.Raw,
    Schematic.CheckFlagResponseData
> = core.serialization.object({
    companyId: core.serialization.property("company_id", core.serialization.string().optional()),
    error: core.serialization.string().optional(),
    flagId: core.serialization.property("flag_id", core.serialization.string().optional()),
    reason: core.serialization.string(),
    ruleId: core.serialization.property("rule_id", core.serialization.string().optional()),
    userId: core.serialization.property("user_id", core.serialization.string().optional()),
    value: core.serialization.boolean(),
});

export declare namespace CheckFlagResponseData {
    interface Raw {
        company_id?: string | null;
        error?: string | null;
        flag_id?: string | null;
        reason: string;
        rule_id?: string | null;
        user_id?: string | null;
        value: boolean;
    }
}
