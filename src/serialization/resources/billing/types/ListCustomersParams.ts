/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const ListCustomersParams: core.serialization.ObjectSchema<
  serializers.ListCustomersParams.Raw,
  Schematic.ListCustomersParams
> = core.serialization.object({
  failedToImport: core.serialization.property("failed_to_import", core.serialization.boolean().optional()),
  limit: core.serialization.number().optional(),
  name: core.serialization.string().optional(),
  offset: core.serialization.number().optional(),
  q: core.serialization.string().optional(),
});

export declare namespace ListCustomersParams {
  interface Raw {
    failed_to_import?: boolean | null;
    limit?: number | null;
    name?: string | null;
    offset?: number | null;
    q?: string | null;
  }
}
