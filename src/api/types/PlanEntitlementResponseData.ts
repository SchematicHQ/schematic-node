/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface PlanEntitlementResponseData {
    createdAt: Date;
    environmentId: string;
    feature?: Schematic.FeatureResponseData;
    featureId: string;
    id: string;
    metricPeriod?: string;
    plan?: Schematic.PlanResponseData;
    planId: string;
    ruleId: string;
    updatedAt: Date;
    valueBool?: boolean;
    valueNumeric?: number;
    valueTrait?: Schematic.EntityTraitDefinitionResponseData;
    valueTraitId?: string;
    valueType: string;
}
