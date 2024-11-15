/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../../index";

/**
 * @example
 *     {
 *         companyId: "company_id",
 *         featureId: "feature_id",
 *         valueType: "boolean"
 *     }
 */
export interface CreateCompanyOverrideRequestBody {
    companyId: string;
    expirationDate?: Date;
    featureId: string;
    metricPeriod?: Schematic.CreateCompanyOverrideRequestBodyMetricPeriod;
    metricPeriodMonthReset?: Schematic.CreateCompanyOverrideRequestBodyMetricPeriodMonthReset;
    valueBool?: boolean;
    valueNumeric?: number;
    valueTraitId?: string;
    valueType: Schematic.CreateCompanyOverrideRequestBodyValueType;
}
