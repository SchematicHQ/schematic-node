/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { RawEventResponseData } from "../../../types/RawEventResponseData";

export const CreateEventResponse: core.serialization.ObjectSchema<
  serializers.CreateEventResponse.Raw,
  Schematic.CreateEventResponse
> = core.serialization.object({
  data: RawEventResponseData,
  params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace CreateEventResponse {
  interface Raw {
    data: RawEventResponseData.Raw;
    params: Record<string, unknown>;
  }
}
