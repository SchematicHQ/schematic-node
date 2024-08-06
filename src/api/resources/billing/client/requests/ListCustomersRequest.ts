/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * @example
 *     {}
 */
export interface ListCustomersRequest {
    name?: string;
    failedToImport?: boolean;
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
