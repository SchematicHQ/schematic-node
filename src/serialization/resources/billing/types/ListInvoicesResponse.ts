/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { InvoiceResponseData } from "../../../types/InvoiceResponseData";
import { ListInvoicesParams } from "./ListInvoicesParams";

export const ListInvoicesResponse: core.serialization.ObjectSchema<
    serializers.ListInvoicesResponse.Raw,
    Schematic.ListInvoicesResponse
> = core.serialization.object({
    data: core.serialization.list(InvoiceResponseData),
    params: ListInvoicesParams,
});

export declare namespace ListInvoicesResponse {
    export interface Raw {
        data: InvoiceResponseData.Raw[];
        params: ListInvoicesParams.Raw;
    }
}
