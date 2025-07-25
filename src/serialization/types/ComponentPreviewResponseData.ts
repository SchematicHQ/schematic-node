/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { CompanyPlanDetailResponseData } from "./CompanyPlanDetailResponseData";
import { UsageBasedEntitlementResponseData } from "./UsageBasedEntitlementResponseData";
import { CompatiblePlans } from "./CompatiblePlans";
import { ComponentCapabilities } from "./ComponentCapabilities";
import { CompanyDetailResponseData } from "./CompanyDetailResponseData";
import { ComponentResponseData } from "./ComponentResponseData";
import { PlanDetailResponseData } from "./PlanDetailResponseData";
import { FeatureUsageDetailResponseData } from "./FeatureUsageDetailResponseData";
import { InvoiceResponseData } from "./InvoiceResponseData";
import { StripeEmbedInfo } from "./StripeEmbedInfo";
import { CompanySubscriptionResponseData } from "./CompanySubscriptionResponseData";

export const ComponentPreviewResponseData: core.serialization.ObjectSchema<
    serializers.ComponentPreviewResponseData.Raw,
    Schematic.ComponentPreviewResponseData
> = core.serialization.object({
    activeAddOns: core.serialization.property("active_add_ons", core.serialization.list(CompanyPlanDetailResponseData)),
    activePlans: core.serialization.property("active_plans", core.serialization.list(CompanyPlanDetailResponseData)),
    activeUsageBasedEntitlements: core.serialization.property(
        "active_usage_based_entitlements",
        core.serialization.list(UsageBasedEntitlementResponseData),
    ),
    addOnCompatibilities: core.serialization.property(
        "add_on_compatibilities",
        core.serialization.list(CompatiblePlans),
    ),
    capabilities: ComponentCapabilities.optional(),
    company: CompanyDetailResponseData.optional(),
    component: ComponentResponseData.optional(),
    defaultPlan: core.serialization.property("default_plan", PlanDetailResponseData.optional()),
    featureUsage: core.serialization.property("feature_usage", FeatureUsageDetailResponseData.optional()),
    invoices: core.serialization.list(InvoiceResponseData),
    stripeEmbed: core.serialization.property("stripe_embed", StripeEmbedInfo.optional()),
    subscription: CompanySubscriptionResponseData.optional(),
    trialPaymentMethodRequired: core.serialization.property(
        "trial_payment_method_required",
        core.serialization.boolean().optional(),
    ),
    upcomingInvoice: core.serialization.property("upcoming_invoice", InvoiceResponseData.optional()),
});

export declare namespace ComponentPreviewResponseData {
    export interface Raw {
        active_add_ons: CompanyPlanDetailResponseData.Raw[];
        active_plans: CompanyPlanDetailResponseData.Raw[];
        active_usage_based_entitlements: UsageBasedEntitlementResponseData.Raw[];
        add_on_compatibilities: CompatiblePlans.Raw[];
        capabilities?: ComponentCapabilities.Raw | null;
        company?: CompanyDetailResponseData.Raw | null;
        component?: ComponentResponseData.Raw | null;
        default_plan?: PlanDetailResponseData.Raw | null;
        feature_usage?: FeatureUsageDetailResponseData.Raw | null;
        invoices: InvoiceResponseData.Raw[];
        stripe_embed?: StripeEmbedInfo.Raw | null;
        subscription?: CompanySubscriptionResponseData.Raw | null;
        trial_payment_method_required?: boolean | null;
        upcoming_invoice?: InvoiceResponseData.Raw | null;
    }
}
