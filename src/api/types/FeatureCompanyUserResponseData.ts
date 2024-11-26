/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface FeatureCompanyUserResponseData {
    /** Whether further usage is permitted. */
    access: boolean;
    /** The maximum amount of usage that is permitted; a null value indicates that unlimited usage is permitted. */
    allocation?: number;
    /** The type of allocation that is being used. */
    allocationType: Schematic.FeatureCompanyUserResponseDataAllocationType;
    company?: Schematic.CompanyDetailResponseData;
    entitlementId: string;
    entitlementType: string;
    feature?: Schematic.FeatureDetailResponseData;
    /** The time at which the metric will resets. */
    metricResetAt?: Date;
    /** If the period is current_month, when the month resets. */
    monthReset?: string;
    /** The period over which usage is measured. */
    period?: string;
    plan?: Schematic.PlanResponseData;
    /** The amount of usage that has been consumed; a null value indicates that usage is not being measured. */
    usage?: number;
    user?: Schematic.UserResponseData;
}
