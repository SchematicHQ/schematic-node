/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const GetActiveCompanySubscriptionParams: core.serialization.ObjectSchema<
    serializers.GetActiveCompanySubscriptionParams.Raw,
    Schematic.GetActiveCompanySubscriptionParams
> = core.serialization.object({
    companyId: core.serialization.property("company_id", core.serialization.string().optional()),
    companyIds: core.serialization.property(
        "company_ids",
        core.serialization.list(core.serialization.string()).optional()
    ),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
});

export declare namespace GetActiveCompanySubscriptionParams {
    interface Raw {
        company_id?: string | null;
        company_ids?: string[] | null;
        limit?: number | null;
        offset?: number | null;
    }
}
