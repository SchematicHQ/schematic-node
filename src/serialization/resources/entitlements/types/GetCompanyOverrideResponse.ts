/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CompanyOverrideResponseData } from "../../../types/CompanyOverrideResponseData";

export const GetCompanyOverrideResponse: core.serialization.ObjectSchema<
  serializers.GetCompanyOverrideResponse.Raw,
  Schematic.GetCompanyOverrideResponse
> = core.serialization.object({
  data: CompanyOverrideResponseData,
  params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace GetCompanyOverrideResponse {
  interface Raw {
    data: CompanyOverrideResponseData.Raw;
    params: Record<string, unknown>;
  }
}
