/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

/**
 * The returned resource
 */
export interface PlanGroupDetailResponseData {
    defaultPlan?: Schematic.PlanGroupPlanDetailResponseData;
    defaultPlanId?: string;
    id: string;
    plans: Schematic.PlanGroupPlanDetailResponseData[];
}