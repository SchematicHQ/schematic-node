/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";
import { CreateOrUpdateConditionRequestBodyConditionType } from "./CreateOrUpdateConditionRequestBodyConditionType";
import { CreateOrUpdateConditionRequestBodyMetricPeriod } from "./CreateOrUpdateConditionRequestBodyMetricPeriod";
import { CreateOrUpdateConditionRequestBodyOperator } from "./CreateOrUpdateConditionRequestBodyOperator";

export const CreateOrUpdateConditionRequestBody: core.serialization.ObjectSchema<
    serializers.CreateOrUpdateConditionRequestBody.Raw,
    Schematic.CreateOrUpdateConditionRequestBody
> = core.serialization.object({
    comparisonTraitId: core.serialization.property("comparison_trait_id", core.serialization.string().optional()),
    conditionType: core.serialization.property("condition_type", CreateOrUpdateConditionRequestBodyConditionType),
    eventSubtype: core.serialization.property("event_subtype", core.serialization.string().optional()),
    id: core.serialization.string().optional(),
    metricPeriod: core.serialization.property(
        "metric_period",
        CreateOrUpdateConditionRequestBodyMetricPeriod.optional()
    ),
    metricValue: core.serialization.property("metric_value", core.serialization.number().optional()),
    operator: CreateOrUpdateConditionRequestBodyOperator,
    resourceIds: core.serialization.property("resource_ids", core.serialization.list(core.serialization.string())),
    traitId: core.serialization.property("trait_id", core.serialization.string().optional()),
    traitValue: core.serialization.property("trait_value", core.serialization.string().optional()),
});

export declare namespace CreateOrUpdateConditionRequestBody {
    interface Raw {
        comparison_trait_id?: string | null;
        condition_type: CreateOrUpdateConditionRequestBodyConditionType.Raw;
        event_subtype?: string | null;
        id?: string | null;
        metric_period?: CreateOrUpdateConditionRequestBodyMetricPeriod.Raw | null;
        metric_value?: number | null;
        operator: CreateOrUpdateConditionRequestBodyOperator.Raw;
        resource_ids: string[];
        trait_id?: string | null;
        trait_value?: string | null;
    }
}
