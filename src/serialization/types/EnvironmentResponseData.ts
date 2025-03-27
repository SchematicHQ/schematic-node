/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const EnvironmentResponseData: core.serialization.ObjectSchema<
    serializers.EnvironmentResponseData.Raw,
    Schematic.EnvironmentResponseData
> = core.serialization.object({
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    environmentType: core.serialization.property("environment_type", core.serialization.string()),
    id: core.serialization.string(),
    name: core.serialization.string(),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
});

export declare namespace EnvironmentResponseData {
    export interface Raw {
        created_at: string;
        environment_type: string;
        id: string;
        name: string;
        updated_at: string;
    }
}
