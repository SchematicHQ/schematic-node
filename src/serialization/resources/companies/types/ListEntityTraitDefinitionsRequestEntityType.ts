/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const ListEntityTraitDefinitionsRequestEntityType: core.serialization.Schema<
    serializers.ListEntityTraitDefinitionsRequestEntityType.Raw,
    Schematic.ListEntityTraitDefinitionsRequestEntityType
> = core.serialization.enum_(["company", "user"]);

export declare namespace ListEntityTraitDefinitionsRequestEntityType {
    type Raw = "company" | "user";
}
