/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";

export const CreateBillingPriceRequestBody: core.serialization.Schema<
  serializers.CreateBillingPriceRequestBody.Raw,
  Schematic.CreateBillingPriceRequestBody
> = core.serialization.object({
  interval: core.serialization.string(),
  price: core.serialization.number(),
  priceExternalId: core.serialization.property("price_external_id", core.serialization.string()),
  productExternalId: core.serialization.property("product_external_id", core.serialization.string()),
});

export declare namespace CreateBillingPriceRequestBody {
  interface Raw {
    interval: string;
    price: number;
    price_external_id: string;
    product_external_id: string;
  }
}
