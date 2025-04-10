/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const FeatureCompanyUserResponseDataAllocationType: core.serialization.Schema<
    serializers.FeatureCompanyUserResponseDataAllocationType.Raw,
    Schematic.FeatureCompanyUserResponseDataAllocationType
> = core.serialization.enum_(["boolean", "numeric", "trait", "unlimited"]);

export declare namespace FeatureCompanyUserResponseDataAllocationType {
    export type Raw = "boolean" | "numeric" | "trait" | "unlimited";
}
