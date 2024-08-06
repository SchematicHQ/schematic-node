/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {
 *         companyId: "company_id",
 *         dealStage: "deal_stage"
 *     }
 */
export interface GetActiveDealsRequest {
  companyId: string;
  dealStage: string;
  /**
   * Page limit (default 100)
   */
  limit?: number;
  /**
   * Page offset (default 0)
   */
  offset?: number;
}
