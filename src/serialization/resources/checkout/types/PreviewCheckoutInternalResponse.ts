/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";
import { PreviewSubscriptionChangeResponseData } from "../../../types/PreviewSubscriptionChangeResponseData";

export const PreviewCheckoutInternalResponse: core.serialization.ObjectSchema<
    serializers.PreviewCheckoutInternalResponse.Raw,
    Schematic.PreviewCheckoutInternalResponse
> = core.serialization.object({
    data: PreviewSubscriptionChangeResponseData,
    params: core.serialization.record(core.serialization.string(), core.serialization.unknown()),
});

export declare namespace PreviewCheckoutInternalResponse {
    export interface Raw {
        data: PreviewSubscriptionChangeResponseData.Raw;
        params: Record<string, unknown>;
    }
}
