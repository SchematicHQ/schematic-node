/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CountEntityKeyDefinitionsResponseParamsEntityType: core.serialization.Schema<
  serializers.CountEntityKeyDefinitionsResponseParamsEntityType.Raw,
  Schematic.CountEntityKeyDefinitionsResponseParamsEntityType
> = core.serialization.enum_(["company", "user"]);

export declare namespace CountEntityKeyDefinitionsResponseParamsEntityType {
  type Raw = "company" | "user";
}
