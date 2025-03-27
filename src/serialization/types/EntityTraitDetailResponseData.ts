/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { EntityTraitDefinitionResponseData } from "./EntityTraitDefinitionResponseData";

export const EntityTraitDetailResponseData: core.serialization.ObjectSchema<
    serializers.EntityTraitDetailResponseData.Raw,
    Schematic.EntityTraitDetailResponseData
> = core.serialization.object({
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    definition: EntityTraitDefinitionResponseData.optional(),
    definitionId: core.serialization.property("definition_id", core.serialization.string()),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    id: core.serialization.string(),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
    value: core.serialization.string(),
});

export declare namespace EntityTraitDetailResponseData {
    export interface Raw {
        created_at: string;
        definition?: EntityTraitDefinitionResponseData.Raw | null;
        definition_id: string;
        environment_id: string;
        id: string;
        updated_at: string;
        value: string;
    }
}
