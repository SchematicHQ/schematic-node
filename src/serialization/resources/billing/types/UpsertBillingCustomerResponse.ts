/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { BillingCustomerResponseData } from "../../../types/BillingCustomerResponseData";

export const UpsertBillingCustomerResponse: core.serialization.ObjectSchema<
  serializers.UpsertBillingCustomerResponse.Raw,
  Schematic.UpsertBillingCustomerResponse
> = core.serialization.object({
  data: BillingCustomerResponseData,
  params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpsertBillingCustomerResponse {
  interface Raw {
    data: BillingCustomerResponseData.Raw;
    params: Record<string, unknown>;
  }
}
