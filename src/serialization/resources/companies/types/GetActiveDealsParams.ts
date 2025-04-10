/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const GetActiveDealsParams: core.serialization.ObjectSchema<
    serializers.GetActiveDealsParams.Raw,
    Schematic.GetActiveDealsParams
> = core.serialization.object({
    companyId: core.serialization.property("company_id", core.serialization.string().optional()),
    dealStage: core.serialization.property("deal_stage", core.serialization.string().optional()),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
});

export declare namespace GetActiveDealsParams {
    export interface Raw {
        company_id?: string | null;
        deal_stage?: string | null;
        limit?: number | null;
        offset?: number | null;
    }
}
