/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const MeterRequestBody: core.serialization.ObjectSchema<
    serializers.MeterRequestBody.Raw,
    Schematic.MeterRequestBody
> = core.serialization.object({
    displayName: core.serialization.property("DisplayName", core.serialization.string()),
    eventName: core.serialization.property("EventName", core.serialization.string()),
    eventPayloadKey: core.serialization.property("EventPayloadKey", core.serialization.string()),
});

export declare namespace MeterRequestBody {
    interface Raw {
        DisplayName: string;
        EventName: string;
        EventPayloadKey: string;
    }
}
