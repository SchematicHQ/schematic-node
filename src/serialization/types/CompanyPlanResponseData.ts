/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const CompanyPlanResponseData: core.serialization.ObjectSchema<
    serializers.CompanyPlanResponseData.Raw,
    Schematic.CompanyPlanResponseData
> = core.serialization.object({
    companyId: core.serialization.property("company_id", core.serialization.string()),
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    id: core.serialization.string(),
    planId: core.serialization.property("plan_id", core.serialization.string()),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
});

export declare namespace CompanyPlanResponseData {
    interface Raw {
        company_id: string;
        created_at: string;
        environment_id: string;
        id: string;
        plan_id: string;
        updated_at: string;
    }
}
