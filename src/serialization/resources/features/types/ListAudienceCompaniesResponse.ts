/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CompanyDetailResponseData } from "../../../types/CompanyDetailResponseData";

export const ListAudienceCompaniesResponse: core.serialization.ObjectSchema<
  serializers.ListAudienceCompaniesResponse.Raw,
  Schematic.ListAudienceCompaniesResponse
> = core.serialization.object({
  data: core.serialization.list(CompanyDetailResponseData),
  params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace ListAudienceCompaniesResponse {
  interface Raw {
    data: CompanyDetailResponseData.Raw[];
    params: Record<string, unknown>;
  }
}
