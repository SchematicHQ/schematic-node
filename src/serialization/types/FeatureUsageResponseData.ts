/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { FeatureUsageResponseDataAllocationType } from "./FeatureUsageResponseDataAllocationType";
import { FeatureDetailResponseData } from "./FeatureDetailResponseData";
import { PlanResponseData } from "./PlanResponseData";

export const FeatureUsageResponseData: core.serialization.ObjectSchema<
  serializers.FeatureUsageResponseData.Raw,
  Schematic.FeatureUsageResponseData
> = core.serialization.object({
  access: core.serialization.boolean(),
  allocation: core.serialization.number().optional(),
  allocationType: core.serialization.property("allocation_type", FeatureUsageResponseDataAllocationType),
  entitlementId: core.serialization.property("entitlement_id", core.serialization.string()),
  entitlementType: core.serialization.property("entitlement_type", core.serialization.string()),
  feature: FeatureDetailResponseData.optional(),
  period: core.serialization.string().optional(),
  plan: PlanResponseData.optional(),
  usage: core.serialization.number().optional(),
});

export declare namespace FeatureUsageResponseData {
  interface Raw {
    access: boolean;
    allocation?: number | null;
    allocation_type: FeatureUsageResponseDataAllocationType.Raw;
    entitlement_id: string;
    entitlement_type: string;
    feature?: FeatureDetailResponseData.Raw | null;
    period?: string | null;
    plan?: PlanResponseData.Raw | null;
    usage?: number | null;
  }
}
