/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../../index";

/**
 * @example
 *     {
 *         valueType: "boolean"
 *     }
 */
export interface UpdateCompanyOverrideRequestBody {
    expirationDate?: Date;
    meteredMonthlyPriceId?: string;
    meteredYearlyPriceId?: string;
    metricPeriod?: Schematic.UpdateCompanyOverrideRequestBodyMetricPeriod;
    metricPeriodMonthReset?: Schematic.UpdateCompanyOverrideRequestBodyMetricPeriodMonthReset;
    valueBool?: boolean;
    valueNumeric?: number;
    valueTraitId?: string;
    valueType: Schematic.UpdateCompanyOverrideRequestBodyValueType;
}
