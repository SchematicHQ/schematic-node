/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface UpdateReqCommon {
    metricPeriod?: Schematic.UpdateReqCommonMetricPeriod;
    valueBool?: boolean;
    valueNumeric?: number;
    valueTraitId?: string;
    valueType: Schematic.UpdateReqCommonValueType;
}
