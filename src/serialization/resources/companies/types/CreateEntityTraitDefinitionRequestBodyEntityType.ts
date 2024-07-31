/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CreateEntityTraitDefinitionRequestBodyEntityType: core.serialization.Schema<
    serializers.CreateEntityTraitDefinitionRequestBodyEntityType.Raw,
    Schematic.CreateEntityTraitDefinitionRequestBodyEntityType
> = core.serialization.enum_(["company", "user"]);

export declare namespace CreateEntityTraitDefinitionRequestBodyEntityType {
    type Raw = "company" | "user";
}
