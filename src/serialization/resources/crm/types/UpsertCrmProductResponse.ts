/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CrmProductResponseData } from "../../../types/CrmProductResponseData";

export const UpsertCrmProductResponse: core.serialization.ObjectSchema<
  serializers.UpsertCrmProductResponse.Raw,
  Schematic.UpsertCrmProductResponse
> = core.serialization.object({
  data: CrmProductResponseData,
  params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpsertCrmProductResponse {
  interface Raw {
    data: CrmProductResponseData.Raw;
    params: Record<string, unknown>;
  }
}
