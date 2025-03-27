/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { InvoiceResponseData } from "../../../types/InvoiceResponseData";

export const UpsertInvoiceResponse: core.serialization.ObjectSchema<
    serializers.UpsertInvoiceResponse.Raw,
    Schematic.UpsertInvoiceResponse
> = core.serialization.object({
    data: InvoiceResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace UpsertInvoiceResponse {
    export interface Raw {
        data: InvoiceResponseData.Raw;
        params: Record<string, unknown>;
    }
}
