/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CountEntityKeyDefinitionsRequestEntityType: core.serialization.Schema<
    serializers.CountEntityKeyDefinitionsRequestEntityType.Raw,
    Schematic.CountEntityKeyDefinitionsRequestEntityType
> = core.serialization.enum_(["company", "user"]);

export declare namespace CountEntityKeyDefinitionsRequestEntityType {
    type Raw = "company" | "user";
}
