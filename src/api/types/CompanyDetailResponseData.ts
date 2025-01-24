/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface CompanyDetailResponseData {
    addOns: Schematic.CompanyPlanWithBillingSubView[];
    billingSubscription?: Schematic.BillingSubscriptionView;
    billingSubscriptions: Schematic.BillingSubscriptionView[];
    createdAt: Date;
    entityTraits: Schematic.EntityTraitDetailResponseData[];
    environmentId: string;
    id: string;
    keys: Schematic.EntityKeyDetailResponseData[];
    lastSeenAt?: Date;
    logoUrl?: string;
    metrics: Schematic.CompanyEventPeriodMetricsResponseData[];
    name: string;
    plan?: Schematic.CompanyPlanWithBillingSubView;
    plans: Schematic.GenericPreviewObject[];
    /** A map of trait names to trait values */
    traits?: Record<string, unknown>;
    updatedAt: Date;
    userCount: number;
}
