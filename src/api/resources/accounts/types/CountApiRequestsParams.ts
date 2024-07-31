/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * Input parameters
 */
export interface CountApiRequestsParams {
    environmentId?: string;
    /** Page limit (default 100) */
    limit?: number;
    /** Page offset (default 0) */
    offset?: number;
    q?: string;
    requestType?: string;
}
