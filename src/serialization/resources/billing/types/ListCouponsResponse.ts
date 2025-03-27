/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { BillingCouponResponseData } from "../../../types/BillingCouponResponseData";
import { ListCouponsParams } from "./ListCouponsParams";

export const ListCouponsResponse: core.serialization.ObjectSchema<
    serializers.ListCouponsResponse.Raw,
    Schematic.ListCouponsResponse
> = core.serialization.object({
    data: core.serialization.list(BillingCouponResponseData),
    params: ListCouponsParams,
});

export declare namespace ListCouponsResponse {
    export interface Raw {
        data: BillingCouponResponseData.Raw[];
        params: ListCouponsParams.Raw;
    }
}
