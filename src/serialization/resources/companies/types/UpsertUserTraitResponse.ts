/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { UserDetailResponseData } from "../../../types/UserDetailResponseData";

export const UpsertUserTraitResponse: core.serialization.ObjectSchema<
    serializers.UpsertUserTraitResponse.Raw,
    Schematic.UpsertUserTraitResponse
> = core.serialization.object({
    data: UserDetailResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpsertUserTraitResponse {
    interface Raw {
        data: UserDetailResponseData.Raw;
        params: Record<string, unknown>;
    }
}
