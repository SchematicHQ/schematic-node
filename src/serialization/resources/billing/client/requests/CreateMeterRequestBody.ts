/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";

export const CreateMeterRequestBody: core.serialization.Schema<
    serializers.CreateMeterRequestBody.Raw,
    Schematic.CreateMeterRequestBody
> = core.serialization.object({
    displayName: core.serialization.property("display_name", core.serialization.string()),
    eventName: core.serialization.property("event_name", core.serialization.string()),
    eventPayloadKey: core.serialization.property("event_payload_key", core.serialization.string()),
    externalId: core.serialization.property("external_id", core.serialization.string()),
});

export declare namespace CreateMeterRequestBody {
    interface Raw {
        display_name: string;
        event_name: string;
        event_payload_key: string;
        external_id: string;
    }
}
