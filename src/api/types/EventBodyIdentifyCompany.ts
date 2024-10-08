/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * Information about the company associated with the user; required only if it is a new user
 */
export interface EventBodyIdentifyCompany {
    /** Key-value pairs to identify the company */
    keys: Record<string, string>;
    /** The display name of the company; required only if it is a new company */
    name?: string;
    /** A map of trait names to trait values */
    traits?: Record<string, unknown>;
}
