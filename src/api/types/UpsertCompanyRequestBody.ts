/**
 * This file was auto-generated by Fern from our API Definition.
 */

export interface UpsertCompanyRequestBody {
    /** If you know the Schematic ID, you can use that here instead of keys */
    id?: string;
    keys: Record<string, string>;
    lastSeenAt?: Date;
    name?: string;
    /** A map of trait names to trait values */
    traits?: Record<string, unknown>;
    updateOnly?: boolean;
}
