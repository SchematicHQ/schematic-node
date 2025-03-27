/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CreateCompanyOverrideRequestBodyValueType: core.serialization.Schema<
    serializers.CreateCompanyOverrideRequestBodyValueType.Raw,
    Schematic.CreateCompanyOverrideRequestBodyValueType
> = core.serialization.enum_(["boolean", "numeric", "trait", "unlimited"]);

export declare namespace CreateCompanyOverrideRequestBodyValueType {
    export type Raw = "boolean" | "numeric" | "trait" | "unlimited";
}
