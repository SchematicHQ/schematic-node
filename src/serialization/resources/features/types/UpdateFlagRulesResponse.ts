/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { RulesDetailResponseData } from "../../../types/RulesDetailResponseData";

export const UpdateFlagRulesResponse: core.serialization.ObjectSchema<
  serializers.UpdateFlagRulesResponse.Raw,
  Schematic.UpdateFlagRulesResponse
> = core.serialization.object({
  data: RulesDetailResponseData,
  params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpdateFlagRulesResponse {
  interface Raw {
    data: RulesDetailResponseData.Raw;
    params: Record<string, unknown>;
  }
}
