/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CountResponse } from "../../../types/CountResponse";
import { CountWebhooksParams } from "./CountWebhooksParams";

export const CountWebhooksResponse: core.serialization.ObjectSchema<
  serializers.CountWebhooksResponse.Raw,
  Schematic.CountWebhooksResponse
> = core.serialization.object({
  data: CountResponse,
  params: CountWebhooksParams,
});

export declare namespace CountWebhooksResponse {
  interface Raw {
    data: CountResponse.Raw;
    params: CountWebhooksParams.Raw;
  }
}
