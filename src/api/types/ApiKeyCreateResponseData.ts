/**
 * This file was auto-generated by Fern from our API Definition.
 */

/**
 * The created resource
 */
export interface ApiKeyCreateResponseData {
    createdAt: Date;
    description?: string;
    environmentId?: string;
    id: string;
    lastUsedAt?: Date;
    name: string;
    scopes: string[];
    secret: string;
    updatedAt: Date;
}
