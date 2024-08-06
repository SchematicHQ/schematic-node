/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CountFeaturesParams: core.serialization.ObjectSchema<
  serializers.CountFeaturesParams.Raw,
  Schematic.CountFeaturesParams
> = core.serialization.object({
  ids: core.serialization.list(core.serialization.string()).optional(),
  limit: core.serialization.number().optional(),
  offset: core.serialization.number().optional(),
  q: core.serialization.string().optional(),
  withoutCompanyOverrideFor: core.serialization.property(
    "without_company_override_for",
    core.serialization.string().optional(),
  ),
  withoutPlanEntitlementFor: core.serialization.property(
    "without_plan_entitlement_for",
    core.serialization.string().optional(),
  ),
});

export declare namespace CountFeaturesParams {
  interface Raw {
    ids?: string[] | null;
    limit?: number | null;
    offset?: number | null;
    q?: string | null;
    without_company_override_for?: string | null;
    without_plan_entitlement_for?: string | null;
  }
}
