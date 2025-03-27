/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../index";
import * as Schematic from "../../api/index";
import * as core from "../../core";

export const CustomPlanViewConfigResponseData: core.serialization.ObjectSchema<
    serializers.CustomPlanViewConfigResponseData.Raw,
    Schematic.CustomPlanViewConfigResponseData
> = core.serialization.object({
    ctaText: core.serialization.property("cta_text", core.serialization.string()),
    ctaWebSite: core.serialization.property("cta_web_site", core.serialization.string()),
    priceText: core.serialization.property("price_text", core.serialization.string()),
});

export declare namespace CustomPlanViewConfigResponseData {
    interface Raw {
        cta_text: string;
        cta_web_site: string;
        price_text: string;
    }
}
