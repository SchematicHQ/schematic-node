/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {
 *         companyId: "company_id"
 *     }
 */
export interface GetActiveCompanySubscriptionRequest {
  companyId: string;
  /**
   * Page limit (default 100)
   */
  limit?: number;
  /**
   * Page offset (default 0)
   */
  offset?: number;
}
