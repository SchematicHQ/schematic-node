/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { UpdateAddOnRequestBody } from "./UpdateAddOnRequestBody";
import { UpdatePayInAdvanceRequestBody } from "./UpdatePayInAdvanceRequestBody";

export const ChangeSubscriptionInternalRequestBody: core.serialization.ObjectSchema<
    serializers.ChangeSubscriptionInternalRequestBody.Raw,
    Schematic.ChangeSubscriptionInternalRequestBody
> = core.serialization.object({
    addOnIds: core.serialization.property("add_on_ids", core.serialization.list(UpdateAddOnRequestBody)),
    companyId: core.serialization.property("company_id", core.serialization.string()),
    couponExternalId: core.serialization.property("coupon_external_id", core.serialization.string().optional()),
    newPlanId: core.serialization.property("new_plan_id", core.serialization.string()),
    newPriceId: core.serialization.property("new_price_id", core.serialization.string()),
    payInAdvance: core.serialization.property("pay_in_advance", core.serialization.list(UpdatePayInAdvanceRequestBody)),
    paymentMethodId: core.serialization.property("payment_method_id", core.serialization.string().optional()),
    promoCode: core.serialization.property("promo_code", core.serialization.string().optional()),
});

export declare namespace ChangeSubscriptionInternalRequestBody {
    export interface Raw {
        add_on_ids: UpdateAddOnRequestBody.Raw[];
        company_id: string;
        coupon_external_id?: string | null;
        new_plan_id: string;
        new_price_id: string;
        pay_in_advance: UpdatePayInAdvanceRequestBody.Raw[];
        payment_method_id?: string | null;
        promo_code?: string | null;
    }
}
