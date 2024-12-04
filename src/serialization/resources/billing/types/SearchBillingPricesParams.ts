/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const SearchBillingPricesParams: core.serialization.ObjectSchema<
    serializers.SearchBillingPricesParams.Raw,
    Schematic.SearchBillingPricesParams
> = core.serialization.object({
    ids: core.serialization.list(core.serialization.string()).optional(),
    interval: core.serialization.string().optional(),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
    price: core.serialization.number().optional(),
    usageType: core.serialization.property("usage_type", core.serialization.string().optional()),
});

export declare namespace SearchBillingPricesParams {
    interface Raw {
        ids?: string[] | null;
        interval?: string | null;
        limit?: number | null;
        offset?: number | null;
        price?: number | null;
        usage_type?: string | null;
    }
}