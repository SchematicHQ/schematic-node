/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * Period of time over which to measure the track event metric
 */
export type CreateOrUpdateConditionRequestBodyMetricPeriod =
    | "billing"
    | "current_month"
    | "current_week"
    | "current_day";

export const CreateOrUpdateConditionRequestBodyMetricPeriod = {
    Billing: "billing",
    CurrentMonth: "current_month",
    CurrentWeek: "current_week",
    CurrentDay: "current_day",
} as const;
