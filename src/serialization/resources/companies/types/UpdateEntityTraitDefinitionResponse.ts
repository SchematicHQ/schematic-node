/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { EntityTraitDefinitionResponseData } from "../../../types/EntityTraitDefinitionResponseData";

export const UpdateEntityTraitDefinitionResponse: core.serialization.ObjectSchema<
    serializers.UpdateEntityTraitDefinitionResponse.Raw,
    Schematic.UpdateEntityTraitDefinitionResponse
> = core.serialization.object({
    data: EntityTraitDefinitionResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpdateEntityTraitDefinitionResponse {
    export interface Raw {
        data: EntityTraitDefinitionResponseData.Raw;
        params: Record<string, unknown>;
    }
}
