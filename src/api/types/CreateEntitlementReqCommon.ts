/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface CreateEntitlementReqCommon {
    featureId: string;
    meteredMonthlyPriceId?: string;
    meteredYearlyPriceId?: string;
    metricPeriod?: Schematic.CreateEntitlementReqCommonMetricPeriod;
    metricPeriodMonthReset?: Schematic.CreateEntitlementReqCommonMetricPeriodMonthReset;
    valueBool?: boolean;
    valueNumeric?: number;
    valueTraitId?: string;
    valueType: Schematic.CreateEntitlementReqCommonValueType;
}
