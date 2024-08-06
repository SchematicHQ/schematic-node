/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {}
 */
export interface ListFeatureUsageRequest {
  companyId?: string;
  companyKeys?: Record<string, string | undefined>;
  featureIds?: string | string[];
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
