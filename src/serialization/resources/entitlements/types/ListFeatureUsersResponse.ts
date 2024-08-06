/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { FeatureCompanyUserResponseData } from "../../../types/FeatureCompanyUserResponseData";
import { ListFeatureUsersParams } from "./ListFeatureUsersParams";

export const ListFeatureUsersResponse: core.serialization.ObjectSchema<
  serializers.ListFeatureUsersResponse.Raw,
  Schematic.ListFeatureUsersResponse
> = core.serialization.object({
  data: core.serialization.list(FeatureCompanyUserResponseData),
  params: ListFeatureUsersParams,
});

export declare namespace ListFeatureUsersResponse {
  interface Raw {
    data: FeatureCompanyUserResponseData.Raw[];
    params: ListFeatureUsersParams.Raw;
  }
}
