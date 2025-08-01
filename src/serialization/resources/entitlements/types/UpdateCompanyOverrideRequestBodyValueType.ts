/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const UpdateCompanyOverrideRequestBodyValueType: core.serialization.Schema<
    serializers.UpdateCompanyOverrideRequestBodyValueType.Raw,
    Schematic.UpdateCompanyOverrideRequestBodyValueType
> = core.serialization.enum_(["boolean", "credit", "numeric", "trait", "unlimited"]);

export declare namespace UpdateCompanyOverrideRequestBodyValueType {
    export type Raw = "boolean" | "credit" | "numeric" | "trait" | "unlimited";
}
