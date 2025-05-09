/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const ListEntityKeyDefinitionsResponseParamsEntityType: core.serialization.Schema<
    serializers.ListEntityKeyDefinitionsResponseParamsEntityType.Raw,
    Schematic.ListEntityKeyDefinitionsResponseParamsEntityType
> = core.serialization.enum_(["company", "user"]);

export declare namespace ListEntityKeyDefinitionsResponseParamsEntityType {
    export type Raw = "company" | "user";
}
