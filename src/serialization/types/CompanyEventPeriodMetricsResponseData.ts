/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const CompanyEventPeriodMetricsResponseData: core.serialization.ObjectSchema<
    serializers.CompanyEventPeriodMetricsResponseData.Raw,
    Schematic.CompanyEventPeriodMetricsResponseData
> = core.serialization.object({
    accountId: core.serialization.property("account_id", core.serialization.string()),
    capturedAtMax: core.serialization.property("captured_at_max", core.serialization.date()),
    capturedAtMin: core.serialization.property("captured_at_min", core.serialization.date()),
    companyId: core.serialization.property("company_id", core.serialization.string()),
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    eventSubtype: core.serialization.property("event_subtype", core.serialization.string()),
    monthReset: core.serialization.property("month_reset", core.serialization.string()),
    period: core.serialization.string(),
    validUntil: core.serialization.property("valid_until", core.serialization.date().optional()),
    value: core.serialization.number(),
});

export declare namespace CompanyEventPeriodMetricsResponseData {
    export interface Raw {
        account_id: string;
        captured_at_max: string;
        captured_at_min: string;
        company_id: string;
        created_at: string;
        environment_id: string;
        event_subtype: string;
        month_reset: string;
        period: string;
        valid_until?: string | null;
        value: number;
    }
}
