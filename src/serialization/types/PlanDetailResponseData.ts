/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { BillingProductDetailResponseData } from "./BillingProductDetailResponseData";
import { FeatureDetailResponseData } from "./FeatureDetailResponseData";

export const PlanDetailResponseData: core.serialization.ObjectSchema<
    serializers.PlanDetailResponseData.Raw,
    Schematic.PlanDetailResponseData
> = core.serialization.object({
    billingProduct: core.serialization.property("billing_product", BillingProductDetailResponseData.optional()),
    companyCount: core.serialization.property("company_count", core.serialization.number()),
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    description: core.serialization.string(),
    features: core.serialization.list(FeatureDetailResponseData),
    icon: core.serialization.string(),
    id: core.serialization.string(),
    name: core.serialization.string(),
    planType: core.serialization.property("plan_type", core.serialization.string()),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
});

export declare namespace PlanDetailResponseData {
    interface Raw {
        billing_product?: BillingProductDetailResponseData.Raw | null;
        company_count: number;
        created_at: string;
        description: string;
        features: FeatureDetailResponseData.Raw[];
        icon: string;
        id: string;
        name: string;
        plan_type: string;
        updated_at: string;
    }
}
