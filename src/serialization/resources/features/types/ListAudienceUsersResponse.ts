/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { UserDetailResponseData } from "../../../types/UserDetailResponseData";

export const ListAudienceUsersResponse: core.serialization.ObjectSchema<
    serializers.ListAudienceUsersResponse.Raw,
    Schematic.ListAudienceUsersResponse
> = core.serialization.object({
    data: core.serialization.list(UserDetailResponseData),
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace ListAudienceUsersResponse {
    interface Raw {
        data: UserDetailResponseData.Raw[];
        params: Record<string, unknown>;
    }
}
