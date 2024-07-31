/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { EntityTraitValue } from "../../../types/EntityTraitValue";
import { GetEntityTraitValuesParams } from "./GetEntityTraitValuesParams";

export const GetEntityTraitValuesResponse: core.serialization.ObjectSchema<
    serializers.GetEntityTraitValuesResponse.Raw,
    Schematic.GetEntityTraitValuesResponse
> = core.serialization.object({
    data: core.serialization.list(EntityTraitValue),
    params: GetEntityTraitValuesParams,
});

export declare namespace GetEntityTraitValuesResponse {
    interface Raw {
        data: EntityTraitValue.Raw[];
        params: GetEntityTraitValuesParams.Raw;
    }
}
