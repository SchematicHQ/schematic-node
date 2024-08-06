/**
 * This file was auto-generated by Fern from our API Definition.
 */

export type UpdateWebhookRequestBodyRequestTypesItem =
    | "company.updated"
    | "user.updated"
    | "plan.updated"
    | "plan.entitlement.updated"
    | "company.override.updated"
    | "feature.updated"
    | "flag.updated"
    | "flag_rules.updated"
    | "company.created"
    | "user.created"
    | "plan.created"
    | "plan.entitlement.created"
    | "company.override.created"
    | "feature.created"
    | "flag.created"
    | "company.deleted"
    | "user.deleted"
    | "plan.deleted"
    | "plan.entitlement.deleted"
    | "company.override.deleted"
    | "feature.deleted"
    | "flag.deleted"
    | "test.send";

export const UpdateWebhookRequestBodyRequestTypesItem = {
    CompanyUpdated: "company.updated",
    UserUpdated: "user.updated",
    PlanUpdated: "plan.updated",
    PlanEntitlementUpdated: "plan.entitlement.updated",
    CompanyOverrideUpdated: "company.override.updated",
    FeatureUpdated: "feature.updated",
    FlagUpdated: "flag.updated",
    FlagRulesUpdated: "flag_rules.updated",
    CompanyCreated: "company.created",
    UserCreated: "user.created",
    PlanCreated: "plan.created",
    PlanEntitlementCreated: "plan.entitlement.created",
    CompanyOverrideCreated: "company.override.created",
    FeatureCreated: "feature.created",
    FlagCreated: "flag.created",
    CompanyDeleted: "company.deleted",
    UserDeleted: "user.deleted",
    PlanDeleted: "plan.deleted",
    PlanEntitlementDeleted: "plan.entitlement.deleted",
    CompanyOverrideDeleted: "company.override.deleted",
    FeatureDeleted: "feature.deleted",
    FlagDeleted: "flag.deleted",
    TestSend: "test.send",
} as const;
