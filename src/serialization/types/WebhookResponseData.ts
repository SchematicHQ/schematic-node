/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const WebhookResponseData: core.serialization.ObjectSchema<
    serializers.WebhookResponseData.Raw,
    Schematic.WebhookResponseData
> = core.serialization.object({
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    id: core.serialization.string(),
    name: core.serialization.string(),
    requestTypes: core.serialization.property("request_types", core.serialization.list(core.serialization.string())),
    secret: core.serialization.string(),
    status: core.serialization.string(),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
    url: core.serialization.string(),
});

export declare namespace WebhookResponseData {
    export interface Raw {
        created_at: string;
        id: string;
        name: string;
        request_types: string[];
        secret: string;
        status: string;
        updated_at: string;
        url: string;
    }
}
