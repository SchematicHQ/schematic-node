/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { EntityTraitDefinitionResponseData } from "../../../types/EntityTraitDefinitionResponseData";

export const GetEntityTraitDefinitionResponse: core.serialization.ObjectSchema<
  serializers.GetEntityTraitDefinitionResponse.Raw,
  Schematic.GetEntityTraitDefinitionResponse
> = core.serialization.object({
  data: EntityTraitDefinitionResponseData,
  params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace GetEntityTraitDefinitionResponse {
  interface Raw {
    data: EntityTraitDefinitionResponseData.Raw;
    params: Record<string, unknown>;
  }
}
