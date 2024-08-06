/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const UpdateComponentRequestBodyEntityType: core.serialization.Schema<
    serializers.UpdateComponentRequestBodyEntityType.Raw,
    Schematic.UpdateComponentRequestBodyEntityType
> = core.serialization.enum_(["entitlement", "billing"]);

export declare namespace UpdateComponentRequestBodyEntityType {
    type Raw = "entitlement" | "billing";
}
