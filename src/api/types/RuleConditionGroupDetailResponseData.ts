/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface RuleConditionGroupDetailResponseData {
    conditions: Schematic.RuleConditionDetailResponseData[];
    createdAt: Date;
    environmentId: string;
    flagId?: string;
    id: string;
    planId?: string;
    ruleId: string;
    updatedAt: Date;
}
