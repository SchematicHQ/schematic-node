/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { CompanyPlanWithBillingSubView } from "./CompanyPlanWithBillingSubView";
import { BillingSubscriptionView } from "./BillingSubscriptionView";
import { PaymentMethodResponseData } from "./PaymentMethodResponseData";
import { EntityTraitDetailResponseData } from "./EntityTraitDetailResponseData";
import { FeatureUsageDataResponseData } from "./FeatureUsageDataResponseData";
import { EntityKeyDetailResponseData } from "./EntityKeyDetailResponseData";
import { CompanyEventPeriodMetricsResponseData } from "./CompanyEventPeriodMetricsResponseData";
import { GenericPreviewObject } from "./GenericPreviewObject";

export const CompanyViewWithFeatureUsageResponseData: core.serialization.ObjectSchema<
    serializers.CompanyViewWithFeatureUsageResponseData.Raw,
    Schematic.CompanyViewWithFeatureUsageResponseData
> = core.serialization.object({
    addOns: core.serialization.property("add_ons", core.serialization.list(CompanyPlanWithBillingSubView)),
    billingSubscription: core.serialization.property("billing_subscription", BillingSubscriptionView.optional()),
    billingSubscriptions: core.serialization.property(
        "billing_subscriptions",
        core.serialization.list(BillingSubscriptionView),
    ),
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    defaultPaymentMethod: core.serialization.property("default_payment_method", PaymentMethodResponseData.optional()),
    entityTraits: core.serialization.property("entity_traits", core.serialization.list(EntityTraitDetailResponseData)),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    featureUsage: core.serialization.property("feature_usage", core.serialization.list(FeatureUsageDataResponseData)),
    id: core.serialization.string(),
    keys: core.serialization.list(EntityKeyDetailResponseData),
    lastSeenAt: core.serialization.property("last_seen_at", core.serialization.date().optional()),
    logoUrl: core.serialization.property("logo_url", core.serialization.string().optional()),
    metrics: core.serialization.list(CompanyEventPeriodMetricsResponseData),
    name: core.serialization.string(),
    paymentMethods: core.serialization.property("payment_methods", core.serialization.list(PaymentMethodResponseData)),
    plan: CompanyPlanWithBillingSubView.optional(),
    plans: core.serialization.list(GenericPreviewObject),
    traits: core.serialization.record(core.serialization.string(), core.serialization.unknown()).optional(),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
    userCount: core.serialization.property("user_count", core.serialization.number()),
});

export declare namespace CompanyViewWithFeatureUsageResponseData {
    export interface Raw {
        add_ons: CompanyPlanWithBillingSubView.Raw[];
        billing_subscription?: BillingSubscriptionView.Raw | null;
        billing_subscriptions: BillingSubscriptionView.Raw[];
        created_at: string;
        default_payment_method?: PaymentMethodResponseData.Raw | null;
        entity_traits: EntityTraitDetailResponseData.Raw[];
        environment_id: string;
        feature_usage: FeatureUsageDataResponseData.Raw[];
        id: string;
        keys: EntityKeyDetailResponseData.Raw[];
        last_seen_at?: string | null;
        logo_url?: string | null;
        metrics: CompanyEventPeriodMetricsResponseData.Raw[];
        name: string;
        payment_methods: PaymentMethodResponseData.Raw[];
        plan?: CompanyPlanWithBillingSubView.Raw | null;
        plans: GenericPreviewObject.Raw[];
        traits?: Record<string, unknown> | null;
        updated_at: string;
        user_count: number;
    }
}
