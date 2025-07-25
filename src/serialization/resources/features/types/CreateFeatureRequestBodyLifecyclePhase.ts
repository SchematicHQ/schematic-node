/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CreateFeatureRequestBodyLifecyclePhase: core.serialization.Schema<
    serializers.CreateFeatureRequestBodyLifecyclePhase.Raw,
    Schematic.CreateFeatureRequestBodyLifecyclePhase
> = core.serialization.enum_([
    "add_on",
    "alpha",
    "beta",
    "deprecated",
    "ga",
    "in_plan",
    "inactive",
    "internal_testing",
    "legacy",
]);

export declare namespace CreateFeatureRequestBodyLifecyclePhase {
    export type Raw =
        | "add_on"
        | "alpha"
        | "beta"
        | "deprecated"
        | "ga"
        | "in_plan"
        | "inactive"
        | "internal_testing"
        | "legacy";
}
