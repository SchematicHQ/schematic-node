/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../index";

/**
 * Input parameters
 */
export interface ListEntityTraitDefinitionsParams {
  entityType?: Schematic.ListEntityTraitDefinitionsResponseParamsEntityType;
  ids?: string[];
  /** Page limit (default 100) */
  limit?: number;
  /** Page offset (default 0) */
  offset?: number;
  q?: string;
  traitType?: Schematic.ListEntityTraitDefinitionsResponseParamsTraitType;
}
