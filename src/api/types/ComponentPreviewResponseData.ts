/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

/**
 * The returned resource
 */
export interface ComponentPreviewResponseData {
    activeAddOns: Schematic.CompanyPlanDetailResponseData[];
    activePlans: Schematic.CompanyPlanDetailResponseData[];
    activeUsageBasedEntitlements: Schematic.UsageBasedEntitlementResponseData[];
    addOnCompatibilities: Schematic.CompatiblePlans[];
    capabilities?: Schematic.ComponentCapabilities;
    company?: Schematic.CompanyDetailResponseData;
    component?: Schematic.ComponentResponseData;
    defaultPlan?: Schematic.PlanDetailResponseData;
    featureUsage?: Schematic.FeatureUsageDetailResponseData;
    invoices: Schematic.InvoiceResponseData[];
    stripeEmbed?: Schematic.StripeEmbedInfo;
    subscription?: Schematic.CompanySubscriptionResponseData;
    trialPaymentMethodRequired?: boolean;
    upcomingInvoice?: Schematic.InvoiceResponseData;
}
