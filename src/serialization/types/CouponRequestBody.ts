/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const CouponRequestBody: core.serialization.ObjectSchema<
    serializers.CouponRequestBody.Raw,
    Schematic.CouponRequestBody
> = core.serialization.object({
    amountOff: core.serialization.property("amount_off", core.serialization.number()),
    currency: core.serialization.string().optional(),
    duration: core.serialization.string(),
    durationInMonths: core.serialization.property("duration_in_months", core.serialization.number()),
    maxRedemptions: core.serialization.property("max_redemptions", core.serialization.number()),
    name: core.serialization.string(),
    percentOff: core.serialization.property("percent_off", core.serialization.number()),
    timesRedeemed: core.serialization.property("times_redeemed", core.serialization.number()),
});

export declare namespace CouponRequestBody {
    interface Raw {
        amount_off: number;
        currency?: string | null;
        duration: string;
        duration_in_months: number;
        max_redemptions: number;
        name: string;
        percent_off: number;
        times_redeemed: number;
    }
}
