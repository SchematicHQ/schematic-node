/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { WebhookResponseData } from "../../../types/WebhookResponseData";

export const UpdateWebhookResponse: core.serialization.ObjectSchema<
    serializers.UpdateWebhookResponse.Raw,
    Schematic.UpdateWebhookResponse
> = core.serialization.object({
    data: WebhookResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpdateWebhookResponse {
    export interface Raw {
        data: WebhookResponseData.Raw;
        params: Record<string, unknown>;
    }
}
