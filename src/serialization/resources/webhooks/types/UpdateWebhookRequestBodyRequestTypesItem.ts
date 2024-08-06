/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const UpdateWebhookRequestBodyRequestTypesItem: core.serialization.Schema<
    serializers.UpdateWebhookRequestBodyRequestTypesItem.Raw,
    Schematic.UpdateWebhookRequestBodyRequestTypesItem
> = core.serialization.enum_([
    "company.updated",
    "user.updated",
    "plan.updated",
    "plan.entitlement.updated",
    "company.override.updated",
    "feature.updated",
    "flag.updated",
    "flag_rules.updated",
    "company.created",
    "user.created",
    "plan.created",
    "plan.entitlement.created",
    "company.override.created",
    "feature.created",
    "flag.created",
    "company.deleted",
    "user.deleted",
    "plan.deleted",
    "plan.entitlement.deleted",
    "company.override.deleted",
    "feature.deleted",
    "flag.deleted",
    "test.send",
]);

export declare namespace UpdateWebhookRequestBodyRequestTypesItem {
    type Raw =
        | "company.updated"
        | "user.updated"
        | "plan.updated"
        | "plan.entitlement.updated"
        | "company.override.updated"
        | "feature.updated"
        | "flag.updated"
        | "flag_rules.updated"
        | "company.created"
        | "user.created"
        | "plan.created"
        | "plan.entitlement.created"
        | "company.override.created"
        | "feature.created"
        | "flag.created"
        | "company.deleted"
        | "user.deleted"
        | "plan.deleted"
        | "plan.entitlement.deleted"
        | "company.override.deleted"
        | "feature.deleted"
        | "flag.deleted"
        | "test.send";
}
