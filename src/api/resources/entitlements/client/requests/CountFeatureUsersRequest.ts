/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {
 *         featureId: "feature_id"
 *     }
 */
export interface CountFeatureUsersRequest {
  featureId: string;
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
