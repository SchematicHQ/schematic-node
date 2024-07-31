/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { UserDetailResponseData } from "../../../types/UserDetailResponseData";

export const UpsertUserResponse: core.serialization.ObjectSchema<
    serializers.UpsertUserResponse.Raw,
    Schematic.UpsertUserResponse
> = core.serialization.object({
    data: UserDetailResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpsertUserResponse {
    interface Raw {
        data: UserDetailResponseData.Raw;
        params: Record<string, unknown>;
    }
}
