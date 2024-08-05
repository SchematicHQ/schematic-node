/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as Schematic from "../index";

export interface EventDetailResponseData {
  apiKey?: string;
  body: Record<string, unknown>;
  bodyPreview: string;
  capturedAt: Date;
  company?: Schematic.PreviewObject;
  companyId?: string;
  enrichedAt?: Date;
  environmentId?: string;
  errorMessage?: string;
  featureIds: string[];
  features: Schematic.PreviewObject[];
  id: string;
  loadedAt?: Date;
  processedAt?: Date;
  sentAt?: Date;
  status: string;
  subtype?: string;
  type: string;
  updatedAt: Date;
  user?: Schematic.PreviewObject;
  userId?: string;
}
