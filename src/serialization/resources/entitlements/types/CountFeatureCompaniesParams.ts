/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CountFeatureCompaniesParams: core.serialization.ObjectSchema<
    serializers.CountFeatureCompaniesParams.Raw,
    Schematic.CountFeatureCompaniesParams
> = core.serialization.object({
    featureId: core.serialization.property("feature_id", core.serialization.string().optional()),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
    q: core.serialization.string().optional(),
});

export declare namespace CountFeatureCompaniesParams {
    export interface Raw {
        feature_id?: string | null;
        limit?: number | null;
        offset?: number | null;
        q?: string | null;
    }
}
