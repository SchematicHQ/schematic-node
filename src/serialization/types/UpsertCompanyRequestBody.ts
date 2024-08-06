/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const UpsertCompanyRequestBody: core.serialization.ObjectSchema<
    serializers.UpsertCompanyRequestBody.Raw,
    Schematic.UpsertCompanyRequestBody
> = core.serialization.object({
    id: core.serialization.string().optional(),
    keys: core.serialization.record(core.serialization.string(), core.serialization.string()),
    lastSeenAt: core.serialization.property("last_seen_at", core.serialization.date().optional()),
    name: core.serialization.string().optional(),
    traits: core.serialization.record(core.serialization.string(), core.serialization.unknown()).optional(),
    updateOnly: core.serialization.property("update_only", core.serialization.boolean().optional()),
});

export declare namespace UpsertCompanyRequestBody {
    interface Raw {
        id?: string | null;
        keys: Record<string, string>;
        last_seen_at?: string | null;
        name?: string | null;
        traits?: Record<string, unknown> | null;
        update_only?: boolean | null;
    }
}
