/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CreateFeatureRequestBodyFeatureType: core.serialization.Schema<
    serializers.CreateFeatureRequestBodyFeatureType.Raw,
    Schematic.CreateFeatureRequestBodyFeatureType
> = core.serialization.enum_(["boolean", "event", "trait"]);

export declare namespace CreateFeatureRequestBodyFeatureType {
    export type Raw = "boolean" | "event" | "trait";
}
