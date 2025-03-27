/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../../index";
import * as Schematic from "../../../../../api/index";
import * as core from "../../../../../core";
import { UpdateFeatureRequestBodyFeatureType } from "../../types/UpdateFeatureRequestBodyFeatureType";
import { CreateOrUpdateFlagRequestBody } from "../../../../types/CreateOrUpdateFlagRequestBody";

export const UpdateFeatureRequestBody: core.serialization.Schema<
    serializers.UpdateFeatureRequestBody.Raw,
    Schematic.UpdateFeatureRequestBody
> = core.serialization.object({
    description: core.serialization.string().optional(),
    eventSubtype: core.serialization.property("event_subtype", core.serialization.string().optional()),
    featureType: core.serialization.property("feature_type", UpdateFeatureRequestBodyFeatureType.optional()),
    flag: CreateOrUpdateFlagRequestBody.optional(),
    icon: core.serialization.string().optional(),
    lifecyclePhase: core.serialization.property("lifecycle_phase", core.serialization.string().optional()),
    maintainerId: core.serialization.property("maintainer_id", core.serialization.string().optional()),
    name: core.serialization.string().optional(),
    pluralName: core.serialization.property("plural_name", core.serialization.string().optional()),
    singularName: core.serialization.property("singular_name", core.serialization.string().optional()),
    traitId: core.serialization.property("trait_id", core.serialization.string().optional()),
});

export declare namespace UpdateFeatureRequestBody {
    interface Raw {
        description?: string | null;
        event_subtype?: string | null;
        feature_type?: UpdateFeatureRequestBodyFeatureType.Raw | null;
        flag?: CreateOrUpdateFlagRequestBody.Raw | null;
        icon?: string | null;
        lifecycle_phase?: string | null;
        maintainer_id?: string | null;
        name?: string | null;
        plural_name?: string | null;
        singular_name?: string | null;
        trait_id?: string | null;
    }
}
