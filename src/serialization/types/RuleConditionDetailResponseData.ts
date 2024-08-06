/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { EntityTraitDefinitionResponseData } from "./EntityTraitDefinitionResponseData";
import { RuleConditionResourceResponseData } from "./RuleConditionResourceResponseData";

export const RuleConditionDetailResponseData: core.serialization.ObjectSchema<
  serializers.RuleConditionDetailResponseData.Raw,
  Schematic.RuleConditionDetailResponseData
> = core.serialization.object({
  comparisonTrait: core.serialization.property("comparison_trait", EntityTraitDefinitionResponseData.optional()),
  comparisonTraitId: core.serialization.property("comparison_trait_id", core.serialization.string().optional()),
  conditionGroupId: core.serialization.property("condition_group_id", core.serialization.string().optional()),
  conditionType: core.serialization.property("condition_type", core.serialization.string()),
  createdAt: core.serialization.property("created_at", core.serialization.date()),
  environmentId: core.serialization.property("environment_id", core.serialization.string()),
  eventSubtype: core.serialization.property("event_subtype", core.serialization.string().optional()),
  flagId: core.serialization.property("flag_id", core.serialization.string().optional()),
  id: core.serialization.string(),
  metricPeriod: core.serialization.property("metric_period", core.serialization.string().optional()),
  metricValue: core.serialization.property("metric_value", core.serialization.number().optional()),
  operator: core.serialization.string(),
  planId: core.serialization.property("plan_id", core.serialization.string().optional()),
  resourceIds: core.serialization.property("resource_ids", core.serialization.list(core.serialization.string())),
  resources: core.serialization.list(RuleConditionResourceResponseData),
  ruleId: core.serialization.property("rule_id", core.serialization.string()),
  trait: EntityTraitDefinitionResponseData.optional(),
  traitEntityType: core.serialization.property("trait_entity_type", core.serialization.string().optional()),
  traitId: core.serialization.property("trait_id", core.serialization.string().optional()),
  traitValue: core.serialization.property("trait_value", core.serialization.string()),
  updatedAt: core.serialization.property("updated_at", core.serialization.date()),
});

export declare namespace RuleConditionDetailResponseData {
  interface Raw {
    comparison_trait?: EntityTraitDefinitionResponseData.Raw | null;
    comparison_trait_id?: string | null;
    condition_group_id?: string | null;
    condition_type: string;
    created_at: string;
    environment_id: string;
    event_subtype?: string | null;
    flag_id?: string | null;
    id: string;
    metric_period?: string | null;
    metric_value?: number | null;
    operator: string;
    plan_id?: string | null;
    resource_ids: string[];
    resources: RuleConditionResourceResponseData.Raw[];
    rule_id: string;
    trait?: EntityTraitDefinitionResponseData.Raw | null;
    trait_entity_type?: string | null;
    trait_id?: string | null;
    trait_value: string;
    updated_at: string;
  }
}
