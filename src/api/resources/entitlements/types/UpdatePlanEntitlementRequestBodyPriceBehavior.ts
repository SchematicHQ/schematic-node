/**
 * This file was auto-generated by Fern from our API Definition.
 */

export type UpdatePlanEntitlementRequestBodyPriceBehavior =
    | "pay_as_you_go"
    | "pay_in_advance"
    | "overage"
    | "credit_burndown"
    | "tier";
export const UpdatePlanEntitlementRequestBodyPriceBehavior = {
    PayAsYouGo: "pay_as_you_go",
    PayInAdvance: "pay_in_advance",
    Overage: "overage",
    CreditBurndown: "credit_burndown",
    Tier: "tier",
} as const;
