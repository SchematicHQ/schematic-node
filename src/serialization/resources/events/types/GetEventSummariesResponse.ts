/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { EventSummaryResponseData } from "../../../types/EventSummaryResponseData";
import { GetEventSummariesParams } from "./GetEventSummariesParams";

export const GetEventSummariesResponse: core.serialization.ObjectSchema<
  serializers.GetEventSummariesResponse.Raw,
  Schematic.GetEventSummariesResponse
> = core.serialization.object({
  data: core.serialization.list(EventSummaryResponseData),
  params: GetEventSummariesParams,
});

export declare namespace GetEventSummariesResponse {
  interface Raw {
    data: EventSummaryResponseData.Raw[];
    params: GetEventSummariesParams.Raw;
  }
}
