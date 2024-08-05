/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";

export const IssueTemporaryAccessTokenRequestBody: core.serialization.Schema<
  serializers.IssueTemporaryAccessTokenRequestBody.Raw,
  Schematic.IssueTemporaryAccessTokenRequestBody
> = core.serialization.object({
  lookup: core.serialization.record(core.serialization.string(), core.serialization.string()),
  resourceType: core.serialization.property("resource_type", core.serialization.string()),
});

export declare namespace IssueTemporaryAccessTokenRequestBody {
  interface Raw {
    lookup: Record<string, string>;
    resource_type: string;
  }
}
