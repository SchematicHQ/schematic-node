/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface PlanGroupPlanDetailResponseData {
    audienceType?: string;
    billingProduct?: Schematic.BillingProductDetailResponseData;
    companyCount: number;
    createdAt: Date;
    description: string;
    entitlements: Schematic.PlanEntitlementResponseData[];
    features: Schematic.FeatureDetailResponseData[];
    icon: string;
    id: string;
    isDefault: boolean;
    isFree: boolean;
    isTrialable: boolean;
    monthlyPrice?: Schematic.BillingPriceResponseData;
    name: string;
    planType: string;
    trialDays?: number;
    updatedAt: Date;
    yearlyPrice?: Schematic.BillingPriceResponseData;
}
