/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const ListEntityTraitDefinitionsResponseParamsTraitType: core.serialization.Schema<
    serializers.ListEntityTraitDefinitionsResponseParamsTraitType.Raw,
    Schematic.ListEntityTraitDefinitionsResponseParamsTraitType
> = core.serialization.enum_(["boolean", "currency", "date", "number", "string", "url"]);

export declare namespace ListEntityTraitDefinitionsResponseParamsTraitType {
    export type Raw = "boolean" | "currency" | "date" | "number" | "string" | "url";
}
