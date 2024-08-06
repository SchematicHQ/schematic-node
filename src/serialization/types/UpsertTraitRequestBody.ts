/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const UpsertTraitRequestBody: core.serialization.ObjectSchema<
    serializers.UpsertTraitRequestBody.Raw,
    Schematic.UpsertTraitRequestBody
> = core.serialization.object({
    incr: core.serialization.number().optional(),
    keys: core.serialization.record(core.serialization.string(), core.serialization.string()),
    set: core.serialization.string().optional(),
    trait: core.serialization.string(),
    updateOnly: core.serialization.property("update_only", core.serialization.boolean().optional()),
});

export declare namespace UpsertTraitRequestBody {
    interface Raw {
        incr?: number | null;
        keys: Record<string, string>;
        set?: string | null;
        trait: string;
        update_only?: boolean | null;
    }
}
