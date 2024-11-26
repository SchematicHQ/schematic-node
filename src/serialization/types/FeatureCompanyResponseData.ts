/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { FeatureCompanyResponseDataAllocationType } from "./FeatureCompanyResponseDataAllocationType";
import { CompanyDetailResponseData } from "./CompanyDetailResponseData";
import { FeatureDetailResponseData } from "./FeatureDetailResponseData";
import { PlanResponseData } from "./PlanResponseData";

export const FeatureCompanyResponseData: core.serialization.ObjectSchema<
    serializers.FeatureCompanyResponseData.Raw,
    Schematic.FeatureCompanyResponseData
> = core.serialization.object({
    access: core.serialization.boolean(),
    allocation: core.serialization.number().optional(),
    allocationType: core.serialization.property("allocation_type", FeatureCompanyResponseDataAllocationType),
    company: CompanyDetailResponseData.optional(),
    entitlementId: core.serialization.property("entitlement_id", core.serialization.string()),
    entitlementType: core.serialization.property("entitlement_type", core.serialization.string()),
    feature: FeatureDetailResponseData.optional(),
    metricResetAt: core.serialization.property("metric_reset_at", core.serialization.date().optional()),
    monthReset: core.serialization.property("month_reset", core.serialization.string().optional()),
    period: core.serialization.string().optional(),
    plan: PlanResponseData.optional(),
    usage: core.serialization.number().optional(),
});

export declare namespace FeatureCompanyResponseData {
    interface Raw {
        access: boolean;
        allocation?: number | null;
        allocation_type: FeatureCompanyResponseDataAllocationType.Raw;
        company?: CompanyDetailResponseData.Raw | null;
        entitlement_id: string;
        entitlement_type: string;
        feature?: FeatureDetailResponseData.Raw | null;
        metric_reset_at?: string | null;
        month_reset?: string | null;
        period?: string | null;
        plan?: PlanResponseData.Raw | null;
        usage?: number | null;
    }
}
