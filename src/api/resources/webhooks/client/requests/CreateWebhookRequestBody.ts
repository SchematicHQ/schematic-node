/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../../../../index";

/**
 * @example
 *     {
 *         name: "name",
 *         requestTypes: [Schematic.CreateWebhookRequestBodyRequestTypesItem.CompanyUpdated],
 *         url: "url"
 *     }
 */
export interface CreateWebhookRequestBody {
    name: string;
    requestTypes: Schematic.CreateWebhookRequestBodyRequestTypesItem[];
    url: string;
}
