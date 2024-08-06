/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { PreviewObject } from "./PreviewObject";
import { EntityTraitDetailResponseData } from "./EntityTraitDetailResponseData";
import { EntityKeyDetailResponseData } from "./EntityKeyDetailResponseData";

export const CompanyDetailResponseData: core.serialization.ObjectSchema<
    serializers.CompanyDetailResponseData.Raw,
    Schematic.CompanyDetailResponseData
> = core.serialization.object({
    addOns: core.serialization.property("add_ons", core.serialization.list(PreviewObject)),
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    entityTraits: core.serialization.property("entity_traits", core.serialization.list(EntityTraitDetailResponseData)),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    id: core.serialization.string(),
    keys: core.serialization.list(EntityKeyDetailResponseData),
    lastSeenAt: core.serialization.property("last_seen_at", core.serialization.date().optional()),
    logoUrl: core.serialization.property("logo_url", core.serialization.string().optional()),
    name: core.serialization.string(),
    plan: PreviewObject.optional(),
    plans: core.serialization.list(PreviewObject),
    traits: core.serialization.record(core.serialization.string(), core.serialization.unknown()).optional(),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
    userCount: core.serialization.property("user_count", core.serialization.number()),
});

export declare namespace CompanyDetailResponseData {
    interface Raw {
        add_ons: PreviewObject.Raw[];
        created_at: string;
        entity_traits: EntityTraitDetailResponseData.Raw[];
        environment_id: string;
        id: string;
        keys: EntityKeyDetailResponseData.Raw[];
        last_seen_at?: string | null;
        logo_url?: string | null;
        name: string;
        plan?: PreviewObject.Raw | null;
        plans: PreviewObject.Raw[];
        traits?: Record<string, unknown> | null;
        updated_at: string;
        user_count: number;
    }
}
