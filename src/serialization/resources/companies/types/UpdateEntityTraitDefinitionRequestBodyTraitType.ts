/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const UpdateEntityTraitDefinitionRequestBodyTraitType: core.serialization.Schema<
    serializers.UpdateEntityTraitDefinitionRequestBodyTraitType.Raw,
    Schematic.UpdateEntityTraitDefinitionRequestBodyTraitType
> = core.serialization.enum_(["boolean", "currency", "date", "number", "string", "url"]);

export declare namespace UpdateEntityTraitDefinitionRequestBodyTraitType {
    export type Raw = "boolean" | "currency" | "date" | "number" | "string" | "url";
}
