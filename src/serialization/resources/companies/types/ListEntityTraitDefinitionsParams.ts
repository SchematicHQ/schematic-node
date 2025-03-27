/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { ListEntityTraitDefinitionsResponseParamsEntityType } from "./ListEntityTraitDefinitionsResponseParamsEntityType";
import { ListEntityTraitDefinitionsResponseParamsTraitType } from "./ListEntityTraitDefinitionsResponseParamsTraitType";

export const ListEntityTraitDefinitionsParams: core.serialization.ObjectSchema<
    serializers.ListEntityTraitDefinitionsParams.Raw,
    Schematic.ListEntityTraitDefinitionsParams
> = core.serialization.object({
    entityType: core.serialization.property(
        "entity_type",
        ListEntityTraitDefinitionsResponseParamsEntityType.optional(),
    ),
    ids: core.serialization.list(core.serialization.string()).optional(),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
    q: core.serialization.string().optional(),
    traitType: core.serialization.property("trait_type", ListEntityTraitDefinitionsResponseParamsTraitType.optional()),
});

export declare namespace ListEntityTraitDefinitionsParams {
    export interface Raw {
        entity_type?: ListEntityTraitDefinitionsResponseParamsEntityType.Raw | null;
        ids?: string[] | null;
        limit?: number | null;
        offset?: number | null;
        q?: string | null;
        trait_type?: ListEntityTraitDefinitionsResponseParamsTraitType.Raw | null;
    }
}
