/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const ListApiRequestsParams: core.serialization.ObjectSchema<
    serializers.ListApiRequestsParams.Raw,
    Schematic.ListApiRequestsParams
> = core.serialization.object({
    environmentId: core.serialization.property("environment_id", core.serialization.string().optional()),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
    q: core.serialization.string().optional(),
    requestType: core.serialization.property("request_type", core.serialization.string().optional()),
});

export declare namespace ListApiRequestsParams {
    export interface Raw {
        environment_id?: string | null;
        limit?: number | null;
        offset?: number | null;
        q?: string | null;
        request_type?: string | null;
    }
}
