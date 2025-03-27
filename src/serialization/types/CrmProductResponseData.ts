/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const CrmProductResponseData: core.serialization.ObjectSchema<
    serializers.CrmProductResponseData.Raw,
    Schematic.CrmProductResponseData
> = core.serialization.object({
    accountId: core.serialization.property("account_id", core.serialization.string()),
    createdAt: core.serialization.property("created_at", core.serialization.date()),
    currency: core.serialization.string(),
    environmentId: core.serialization.property("environment_id", core.serialization.string()),
    externalId: core.serialization.property("external_id", core.serialization.string()),
    name: core.serialization.string(),
    price: core.serialization.string(),
    productId: core.serialization.property("product_id", core.serialization.string()),
    quantity: core.serialization.number(),
    updatedAt: core.serialization.property("updated_at", core.serialization.date()),
});

export declare namespace CrmProductResponseData {
    export interface Raw {
        account_id: string;
        created_at: string;
        currency: string;
        environment_id: string;
        external_id: string;
        name: string;
        price: string;
        product_id: string;
        quantity: number;
        updated_at: string;
    }
}
