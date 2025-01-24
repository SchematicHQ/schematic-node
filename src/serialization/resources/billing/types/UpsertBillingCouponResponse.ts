/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { BillingCouponResponseData } from "../../../types/BillingCouponResponseData";

export const UpsertBillingCouponResponse: core.serialization.ObjectSchema<
    serializers.UpsertBillingCouponResponse.Raw,
    Schematic.UpsertBillingCouponResponse
> = core.serialization.object({
    data: BillingCouponResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpsertBillingCouponResponse {
    interface Raw {
        data: BillingCouponResponseData.Raw;
        params: Record<string, unknown>;
    }
}
