/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CountResponse } from "../../../types/CountResponse";

export const CountAudienceCompaniesResponse: core.serialization.ObjectSchema<
  serializers.CountAudienceCompaniesResponse.Raw,
  Schematic.CountAudienceCompaniesResponse
> = core.serialization.object({
  data: CountResponse,
  params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace CountAudienceCompaniesResponse {
  interface Raw {
    data: CountResponse.Raw;
    params: Record<string, unknown>;
  }
}
