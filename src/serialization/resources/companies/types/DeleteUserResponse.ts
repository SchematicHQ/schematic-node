/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { DeleteResponse } from "../../../types/DeleteResponse";

export const DeleteUserResponse: core.serialization.ObjectSchema<
  serializers.DeleteUserResponse.Raw,
  Schematic.DeleteUserResponse
> = core.serialization.object({
  data: DeleteResponse,
  params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace DeleteUserResponse {
  interface Raw {
    data: DeleteResponse.Raw;
    params: Record<string, unknown>;
  }
}
