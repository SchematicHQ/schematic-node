/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../../index";

/**
 * @example
 *     {}
 */
export interface UpdateFeatureRequestBody {
    description?: string;
    eventSubtype?: string;
    featureType?: Schematic.UpdateFeatureRequestBodyFeatureType;
    flag?: Schematic.CreateOrUpdateFlagRequestBody;
    icon?: string;
    lifecyclePhase?: string;
    maintainerId?: string;
    name?: string;
    traitId?: string;
}
