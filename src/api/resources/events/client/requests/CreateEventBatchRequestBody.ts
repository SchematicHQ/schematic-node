/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../../index";

/**
 * @example
 *     {
 *         events: [{
 *                 eventType: "identify"
 *             }]
 *     }
 */
export interface CreateEventBatchRequestBody {
    events: Schematic.CreateEventRequestBody[];
}
