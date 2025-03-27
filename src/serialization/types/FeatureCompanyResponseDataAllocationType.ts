/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const FeatureCompanyResponseDataAllocationType: core.serialization.Schema<
    serializers.FeatureCompanyResponseDataAllocationType.Raw,
    Schematic.FeatureCompanyResponseDataAllocationType
> = core.serialization.enum_(["boolean", "numeric", "trait", "unlimited"]);

export declare namespace FeatureCompanyResponseDataAllocationType {
    export type Raw = "boolean" | "numeric" | "trait" | "unlimited";
}
