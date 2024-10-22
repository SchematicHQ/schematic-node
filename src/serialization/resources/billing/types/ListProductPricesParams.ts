/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const ListProductPricesParams: core.serialization.ObjectSchema<
    serializers.ListProductPricesParams.Raw,
    Schematic.ListProductPricesParams
> = core.serialization.object({
    ids: core.serialization.list(core.serialization.string()).optional(),
    limit: core.serialization.number().optional(),
    name: core.serialization.string().optional(),
    offset: core.serialization.number().optional(),
    q: core.serialization.string().optional(),
    withoutLinkedToPlan: core.serialization.property("without_linked_to_plan", core.serialization.boolean().optional()),
});

export declare namespace ListProductPricesParams {
    interface Raw {
        ids?: string[] | null;
        limit?: number | null;
        name?: string | null;
        offset?: number | null;
        q?: string | null;
        without_linked_to_plan?: boolean | null;
    }
}
