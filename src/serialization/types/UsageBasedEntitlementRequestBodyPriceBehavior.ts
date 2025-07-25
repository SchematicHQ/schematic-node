/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const UsageBasedEntitlementRequestBodyPriceBehavior: core.serialization.Schema<
    serializers.UsageBasedEntitlementRequestBodyPriceBehavior.Raw,
    Schematic.UsageBasedEntitlementRequestBodyPriceBehavior
> = core.serialization.enum_(["pay_as_you_go", "pay_in_advance", "overage", "credit_burndown", "tier"]);

export declare namespace UsageBasedEntitlementRequestBodyPriceBehavior {
    export type Raw = "pay_as_you_go" | "pay_in_advance" | "overage" | "credit_burndown" | "tier";
}
