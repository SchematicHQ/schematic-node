/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const BillingCustomerResponseData: core.serialization.ObjectSchema<
    serializers.BillingCustomerResponseData.Raw,
    Schematic.BillingCustomerResponseData
> = core.serialization.object({
    companyId: core.serialization.property("company_id", core.serialization.string().optional()),
    deletedAt: core.serialization.property("deleted_at", core.serialization.date().optional()),
    email: core.serialization.string(),
    externalId: core.serialization.property("external_id", core.serialization.string()),
    failedToImport: core.serialization.property("failed_to_import", core.serialization.boolean()),
    id: core.serialization.string(),
    name: core.serialization.string(),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
});

export declare namespace BillingCustomerResponseData {
    export interface Raw {
        company_id?: string | null;
        deleted_at?: string | null;
        email: string;
        external_id: string;
        failed_to_import: boolean;
        id: string;
        name: string;
        updated_at: string;
    }
}
