/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../../index";

/**
 * @example
 *     {
 *         conditionGroups: [{
 *                 conditions: [{
 *                         conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
 *                         operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
 *                         resourceIds: ["resource_ids"]
 *                     }]
 *             }],
 *         conditions: [{
 *                 conditionType: Schematic.CreateOrUpdateConditionRequestBodyConditionType.Company,
 *                 operator: Schematic.CreateOrUpdateConditionRequestBodyOperator.Eq,
 *                 resourceIds: ["resource_ids"]
 *             }]
 *     }
 */
export interface UpdateAudienceRequestBody {
  conditionGroups: Schematic.CreateOrUpdateConditionGroupRequestBody[];
  conditions: Schematic.CreateOrUpdateConditionRequestBody[];
}
