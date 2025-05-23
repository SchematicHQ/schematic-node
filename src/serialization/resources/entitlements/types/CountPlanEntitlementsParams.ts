/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CountPlanEntitlementsParams: core.serialization.ObjectSchema<
    serializers.CountPlanEntitlementsParams.Raw,
    Schematic.CountPlanEntitlementsParams
> = core.serialization.object({
    featureId: core.serialization.property("feature_id", core.serialization.string().optional()),
    featureIds: core.serialization.property(
        "feature_ids",
        core.serialization.list(core.serialization.string()).optional(),
    ),
    ids: core.serialization.list(core.serialization.string()).optional(),
    limit: core.serialization.number().optional(),
    offset: core.serialization.number().optional(),
    planId: core.serialization.property("plan_id", core.serialization.string().optional()),
    planIds: core.serialization.property("plan_ids", core.serialization.list(core.serialization.string()).optional()),
    q: core.serialization.string().optional(),
    withMeteredProducts: core.serialization.property("with_metered_products", core.serialization.boolean().optional()),
});

export declare namespace CountPlanEntitlementsParams {
    export interface Raw {
        feature_id?: string | null;
        feature_ids?: string[] | null;
        ids?: string[] | null;
        limit?: number | null;
        offset?: number | null;
        plan_id?: string | null;
        plan_ids?: string[] | null;
        q?: string | null;
        with_metered_products?: boolean | null;
    }
}
