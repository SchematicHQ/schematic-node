/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const UpdateEnvironmentRequestBodyEnvironmentType: core.serialization.Schema<
    serializers.UpdateEnvironmentRequestBodyEnvironmentType.Raw,
    Schematic.UpdateEnvironmentRequestBodyEnvironmentType
> = core.serialization.enum_(["development", "staging", "production"]);

export declare namespace UpdateEnvironmentRequestBodyEnvironmentType {
    export type Raw = "development" | "staging" | "production";
}
