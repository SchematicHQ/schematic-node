/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const EntityKeyResponseData: core.serialization.ObjectSchema<
    serializers.EntityKeyResponseData.Raw,
    Schematic.EntityKeyResponseData
> = core.serialization.object({
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    definitionId: core.serialization.property("definition_id", core.serialization.string()),
    entityId: core.serialization.property("entity_id", core.serialization.string()),
    entityType: core.serialization.property("entity_type", core.serialization.string()),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    id: core.serialization.string(),
    key: core.serialization.string(),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
    value: core.serialization.string(),
});

export declare namespace EntityKeyResponseData {
    interface Raw {
        created_at: string;
        definition_id: string;
        entity_id: string;
        entity_type: string;
        environment_id: string;
        id: string;
        key: string;
        updated_at: string;
        value: string;
    }
}
