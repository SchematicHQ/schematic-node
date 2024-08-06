/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { CountEntityKeyDefinitionsResponseParamsEntityType } from "./CountEntityKeyDefinitionsResponseParamsEntityType";

export const CountEntityKeyDefinitionsParams: core.serialization.ObjectSchema<
    serializers.CountEntityKeyDefinitionsParams.Raw,
    Schematic.CountEntityKeyDefinitionsParams
> = core.serialization.object({
    entityType: core.serialization.property(
        "entity_type",
        CountEntityKeyDefinitionsResponseParamsEntityType.optional()
    ),
    ids: core.serialization.list(core.serialization.string()).optional(),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
    q: core.serialization.string().optional(),
});

export declare namespace CountEntityKeyDefinitionsParams {
    interface Raw {
        entity_type?: CountEntityKeyDefinitionsResponseParamsEntityType.Raw | null;
        ids?: string[] | null;
        limit?: number | null;
        offset?: number | null;
        q?: string | null;
    }
}
