/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as serializers from "../../../index";
import * as Schematic from "../../../../api/index";
import * as core from "../../../../core";

export const CountCompaniesForAdvancedFilterResponseParamsSortOrderDirection: core.serialization.Schema<
    serializers.CountCompaniesForAdvancedFilterResponseParamsSortOrderDirection.Raw,
    Schematic.CountCompaniesForAdvancedFilterResponseParamsSortOrderDirection
> = core.serialization.enum_(["asc", "desc"]);

export declare namespace CountCompaniesForAdvancedFilterResponseParamsSortOrderDirection {
    export type Raw = "asc" | "desc";
}
