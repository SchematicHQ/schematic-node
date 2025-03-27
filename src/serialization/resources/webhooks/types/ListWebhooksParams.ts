/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const ListWebhooksParams: core.serialization.ObjectSchema<
    serializers.ListWebhooksParams.Raw,
    Schematic.ListWebhooksParams
> = core.serialization.object({
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
    q: core.serialization.string().optional(),
});

export declare namespace ListWebhooksParams {
    export interface Raw {
        limit?: number | null;
        offset?: number | null;
        q?: string | null;
    }
}
