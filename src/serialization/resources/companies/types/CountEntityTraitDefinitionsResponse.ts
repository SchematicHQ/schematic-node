/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CountResponse } from "../../../types/CountResponse";
import { CountEntityTraitDefinitionsParams } from "./CountEntityTraitDefinitionsParams";

export const CountEntityTraitDefinitionsResponse: core.serialization.ObjectSchema<
    serializers.CountEntityTraitDefinitionsResponse.Raw,
    Schematic.CountEntityTraitDefinitionsResponse
> = core.serialization.object({
    data: CountResponse,
    params: CountEntityTraitDefinitionsParams,
});

export declare namespace CountEntityTraitDefinitionsResponse {
    interface Raw {
        data: CountResponse.Raw;
        params: CountEntityTraitDefinitionsParams.Raw;
    }
}
