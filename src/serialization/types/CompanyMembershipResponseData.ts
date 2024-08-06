/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const CompanyMembershipResponseData: core.serialization.ObjectSchema<
    serializers.CompanyMembershipResponseData.Raw,
    Schematic.CompanyMembershipResponseData
> = core.serialization.object({
    companyId: core.serialization.property("company_id", core.serialization.string()),
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    id: core.serialization.string(),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
    userId: core.serialization.property("user_id", core.serialization.string()),
});

export declare namespace CompanyMembershipResponseData {
    interface Raw {
        company_id: string;
        created_at: string;
        id: string;
        updated_at: string;
        user_id: string;
    }
}
