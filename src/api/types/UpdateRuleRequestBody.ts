/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface UpdateRuleRequestBody {
    conditionGroups: Schematic.CreateOrUpdateConditionGroupRequestBody[];
    conditions: Schematic.CreateOrUpdateConditionRequestBody[];
    name: string;
    priority: number;
    value: boolean;
}
