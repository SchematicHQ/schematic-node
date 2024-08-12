/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

/**
 * The updated resource
 */
export interface PlanDetailResponseData {
    billingProduct?: Schematic.BillingProductDetailResponseData;
    companyCount: number;
    createdAt: Date;
    description: string;
    features: Schematic.FeatureDetailResponseData[];
    icon: string;
    id: string;
    name: string;
    planType: string;
    updatedAt: Date;
}
