/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface UpdateEntitlementReqCommon {
    metricPeriod?: Schematic.UpdateEntitlementReqCommonMetricPeriod;
    metricPeriodMonthReset?: Schematic.UpdateEntitlementReqCommonMetricPeriodMonthReset;
    valueBool?: boolean;
    valueNumeric?: number;
    valueTraitId?: string;
    valueType: Schematic.UpdateEntitlementReqCommonValueType;
}