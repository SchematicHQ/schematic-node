/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { BillingCustomerWithSubscriptionsResponseData } from "../../../types/BillingCustomerWithSubscriptionsResponseData";
import { ListCustomersWithSubscriptionsParams } from "./ListCustomersWithSubscriptionsParams";

export const ListCustomersWithSubscriptionsResponse: core.serialization.ObjectSchema<
    serializers.ListCustomersWithSubscriptionsResponse.Raw,
    Schematic.ListCustomersWithSubscriptionsResponse
> = core.serialization.object({
    data: core.serialization.list(BillingCustomerWithSubscriptionsResponseData),
    params: ListCustomersWithSubscriptionsParams,
});

export declare namespace ListCustomersWithSubscriptionsResponse {
    export interface Raw {
        data: BillingCustomerWithSubscriptionsResponseData.Raw[];
        params: ListCustomersWithSubscriptionsParams.Raw;
    }
}
