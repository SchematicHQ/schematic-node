/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface UsageBasedEntitlementResponseData {
    featureId: string;
    meteredPrice?: Schematic.BillingPriceView;
    metricPeriod?: string;
    metricPeriodMonthReset?: string;
    priceBehavior?: string;
    valueBool?: boolean;
    valueNumeric?: number;
    valueType: string;
}
