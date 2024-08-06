/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const GetFeatureUsageByCompanyParams: core.serialization.ObjectSchema<
    serializers.GetFeatureUsageByCompanyParams.Raw,
    Schematic.GetFeatureUsageByCompanyParams
> = core.serialization.object({
    keys: core.serialization.record(core.serialization.string(), core.serialization.unknown()).optional(),
});

export declare namespace GetFeatureUsageByCompanyParams {
    interface Raw {
        keys?: Record<string, unknown> | null;
    }
}
