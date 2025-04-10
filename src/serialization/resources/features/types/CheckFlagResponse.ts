/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CheckFlagResponseData } from "../../../types/CheckFlagResponseData";

export const CheckFlagResponse: core.serialization.ObjectSchema<
    serializers.CheckFlagResponse.Raw,
    Schematic.CheckFlagResponse
> = core.serialization.object({
    data: CheckFlagResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace CheckFlagResponse {
    export interface Raw {
        data: CheckFlagResponseData.Raw;
        params: Record<string, unknown>;
    }
}
