/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { CreateEventRequestBody } from "../../../../types/CreateEventRequestBody";

export const CreateEventBatchRequestBody: core.serialization.Schema<
    serializers.CreateEventBatchRequestBody.Raw,
    Schematic.CreateEventBatchRequestBody
> = core.serialization.object({
    events: core.serialization.list(CreateEventRequestBody),
});

export declare namespace CreateEventBatchRequestBody {
    interface Raw {
        events: CreateEventRequestBody.Raw[];
    }
}
