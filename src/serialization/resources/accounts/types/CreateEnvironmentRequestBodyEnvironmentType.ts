/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CreateEnvironmentRequestBodyEnvironmentType: core.serialization.Schema<
    serializers.CreateEnvironmentRequestBodyEnvironmentType.Raw,
    Schematic.CreateEnvironmentRequestBodyEnvironmentType
> = core.serialization.enum_(["development", "staging", "production"]);

export declare namespace CreateEnvironmentRequestBodyEnvironmentType {
    export type Raw = "development" | "staging" | "production";
}
