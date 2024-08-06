/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { FeatureResponseData } from "./FeatureResponseData";
import { RuleDetailResponseData } from "./RuleDetailResponseData";

export const FlagDetailResponseData: core.serialization.ObjectSchema<
  serializers.FlagDetailResponseData.Raw,
  Schematic.FlagDetailResponseData
> = core.serialization.object({
  createdAt: core.serialization.property("created_at", core.serialization.date()),
  defaultValue: core.serialization.property("default_value", core.serialization.boolean()),
  description: core.serialization.string(),
  feature: FeatureResponseData.optional(),
  featureId: core.serialization.property("feature_id", core.serialization.string().optional()),
  flagType: core.serialization.property("flag_type", core.serialization.string()),
  id: core.serialization.string(),
  key: core.serialization.string(),
  lastCheckedAt: core.serialization.property("last_checked_at", core.serialization.date().optional()),
  maintainerId: core.serialization.property("maintainer_id", core.serialization.string().optional()),
  name: core.serialization.string(),
  rules: core.serialization.list(RuleDetailResponseData),
  updatedAt: core.serialization.property("updated_at", core.serialization.date()),
});

export declare namespace FlagDetailResponseData {
  interface Raw {
    created_at: string;
    default_value: boolean;
    description: string;
    feature?: FeatureResponseData.Raw | null;
    feature_id?: string | null;
    flag_type: string;
    id: string;
    key: string;
    last_checked_at?: string | null;
    maintainer_id?: string | null;
    name: string;
    rules: RuleDetailResponseData.Raw[];
    updated_at: string;
  }
}
