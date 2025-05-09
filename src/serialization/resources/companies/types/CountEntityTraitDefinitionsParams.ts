/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CountEntityTraitDefinitionsResponseParamsEntityType } from "./CountEntityTraitDefinitionsResponseParamsEntityType";
import { CountEntityTraitDefinitionsResponseParamsTraitType } from "./CountEntityTraitDefinitionsResponseParamsTraitType";

export const CountEntityTraitDefinitionsParams: core.serialization.ObjectSchema<
    serializers.CountEntityTraitDefinitionsParams.Raw,
    Schematic.CountEntityTraitDefinitionsParams
> = core.serialization.object({
    entityType: core.serialization.property(
        "entity_type",
        CountEntityTraitDefinitionsResponseParamsEntityType.optional(),
    ),
    ids: core.serialization.list(core.serialization.string()).optional(),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
    q: core.serialization.string().optional(),
    traitType: core.serialization.property("trait_type", CountEntityTraitDefinitionsResponseParamsTraitType.optional()),
});

export declare namespace CountEntityTraitDefinitionsParams {
    export interface Raw {
        entity_type?: CountEntityTraitDefinitionsResponseParamsEntityType.Raw | null;
        ids?: string[] | null;
        limit?: number | null;
        offset?: number | null;
        q?: string | null;
        trait_type?: CountEntityTraitDefinitionsResponseParamsTraitType.Raw | null;
    }
}
