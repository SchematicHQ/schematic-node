/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const FeatureUsageResponseDataAllocationType: core.serialization.Schema<
    serializers.FeatureUsageResponseDataAllocationType.Raw,
    Schematic.FeatureUsageResponseDataAllocationType
> = core.serialization.enum_(["boolean", "numeric", "trait", "unlimited"]);

export declare namespace FeatureUsageResponseDataAllocationType {
    export type Raw = "boolean" | "numeric" | "trait" | "unlimited";
}
