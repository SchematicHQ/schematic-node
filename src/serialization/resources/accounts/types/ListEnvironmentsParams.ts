/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const ListEnvironmentsParams: core.serialization.ObjectSchema<
    serializers.ListEnvironmentsParams.Raw,
    Schematic.ListEnvironmentsParams
> = core.serialization.object({
    ids: core.serialization.list(core.serialization.string()).optional(),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
});

export declare namespace ListEnvironmentsParams {
    interface Raw {
        ids?: string[] | null;
        limit?: number | null;
        offset?: number | null;
    }
}
