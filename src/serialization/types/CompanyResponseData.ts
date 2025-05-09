/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const CompanyResponseData: core.serialization.ObjectSchema<
    serializers.CompanyResponseData.Raw,
    Schematic.CompanyResponseData
> = core.serialization.object({
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    id: core.serialization.string(),
    lastSeenAt: core.serialization.property("last_seen_at", core.serialization.date().optional()),
    logoUrl: core.serialization.property("logo_url", core.serialization.string().optional()),
    name: core.serialization.string(),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
});

export declare namespace CompanyResponseData {
    export interface Raw {
        created_at: string;
        environment_id: string;
        id: string;
        last_seen_at?: string | null;
        logo_url?: string | null;
        name: string;
        updated_at: string;
    }
}
