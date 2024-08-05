/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

/**
 * The created resource
 */
export interface EnvironmentDetailResponseData {
  apiKeys: Schematic.ApiKeyResponseData[];
  createdAt: Date;
  environmentType: string;
  id: string;
  name: string;
  updatedAt: Date;
}
