/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../../index";

/**
 * @example
 *     {}
 */
export interface ListEntityTraitDefinitionsRequest {
    entityType?: Schematic.ListEntityTraitDefinitionsRequestEntityType;
    ids?: string | string[];
    traitType?: Schematic.ListEntityTraitDefinitionsRequestTraitType;
    q?: string;
    /**
     * Page limit (default 100)
     */
    limit?: number;
    /**
     * Page offset (default 0)
     */
    offset?: number;
}
