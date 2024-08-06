/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const ListMetricCountsParams: core.serialization.ObjectSchema<
  serializers.ListMetricCountsParams.Raw,
  Schematic.ListMetricCountsParams
> = core.serialization.object({
  companyId: core.serialization.property("company_id", core.serialization.string().optional()),
  companyIds: core.serialization.property(
    "company_ids",
    core.serialization.list(core.serialization.string()).optional(),
  ),
  endTime: core.serialization.property("end_time", core.serialization.date().optional()),
  eventSubtype: core.serialization.property("event_subtype", core.serialization.string().optional()),
  eventSubtypes: core.serialization.property(
    "event_subtypes",
    core.serialization.list(core.serialization.string()).optional(),
  ),
  grouping: core.serialization.string().optional(),
  limit: core.serialization.number().optional(),
  offset: core.serialization.number().optional(),
  startTime: core.serialization.property("start_time", core.serialization.date().optional()),
  userId: core.serialization.property("user_id", core.serialization.string().optional()),
});

export declare namespace ListMetricCountsParams {
  interface Raw {
    company_id?: string | null;
    company_ids?: string[] | null;
    end_time?: string | null;
    event_subtype?: string | null;
    event_subtypes?: string[] | null;
    grouping?: string | null;
    limit?: number | null;
    offset?: number | null;
    start_time?: string | null;
    user_id?: string | null;
  }
}
