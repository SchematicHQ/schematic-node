/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as environments from "../../../../environments";
import * as core from "../../../../core";
import * as Schematic from "../../../index";
import * as serializers from "../../../../serialization/index";
import urlJoin from "url-join";
import * as errors from "../../../../errors/index";

export declare namespace Checkout {
    export interface Options {
        environment?: core.Supplier<environments.SchematicEnvironment | string>;
        /** Specify a custom URL to connect the client to. */
        baseUrl?: core.Supplier<string>;
        apiKey: core.Supplier<string>;
        fetcher?: core.FetchFunction;
    }

    export interface RequestOptions {
        /** The maximum time to wait for a response in seconds. */
        timeoutInSeconds?: number;
        /** The number of times to retry the request. Defaults to 2. */
        maxRetries?: number;
        /** A hook to abort the request. */
        abortSignal?: AbortSignal;
        /** Additional headers to include in the request. */
        headers?: Record<string, string>;
    }
}

export class Checkout {
    constructor(protected readonly _options: Checkout.Options) {}

    /**
     * @param {Schematic.ChangeSubscriptionInternalRequestBody} request
     * @param {Checkout.RequestOptions} requestOptions - Request-specific configuration.
     *
     * @throws {@link Schematic.BadRequestError}
     * @throws {@link Schematic.UnauthorizedError}
     * @throws {@link Schematic.ForbiddenError}
     * @throws {@link Schematic.InternalServerError}
     *
     * @example
     *     await client.checkout.internal({
     *         addOnIds: [{
     *                 addOnId: "add_on_id",
     *                 priceId: "price_id"
     *             }],
     *         companyId: "company_id",
     *         newPlanId: "new_plan_id",
     *         newPriceId: "new_price_id",
     *         payInAdvance: [{
     *                 priceId: "price_id",
     *                 quantity: 1
     *             }]
     *     })
     */
    public async internal(
        request: Schematic.ChangeSubscriptionInternalRequestBody,
        requestOptions?: Checkout.RequestOptions,
    ): Promise<Schematic.CheckoutInternalResponse> {
        const _response = await (this._options.fetcher ?? core.fetcher)({
            url: urlJoin(
                (await core.Supplier.get(this._options.baseUrl)) ??
                    (await core.Supplier.get(this._options.environment)) ??
                    environments.SchematicEnvironment.Default,
                "checkout-internal",
            ),
            method: "POST",
            headers: {
                "X-Fern-Language": "JavaScript",
                "X-Fern-SDK-Name": "@schematichq/schematic-typescript-node",
                "X-Fern-SDK-Version": "1.1.10",
                "User-Agent": "@schematichq/schematic-typescript-node/1.1.10",
                "X-Fern-Runtime": core.RUNTIME.type,
                "X-Fern-Runtime-Version": core.RUNTIME.version,
                ...(await this._getCustomAuthorizationHeaders()),
                ...requestOptions?.headers,
            },
            contentType: "application/json",
            requestType: "json",
            body: serializers.ChangeSubscriptionInternalRequestBody.jsonOrThrow(request, {
                unrecognizedObjectKeys: "strip",
            }),
            timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
            maxRetries: requestOptions?.maxRetries,
            abortSignal: requestOptions?.abortSignal,
        });
        if (_response.ok) {
            return serializers.CheckoutInternalResponse.parseOrThrow(_response.body, {
                unrecognizedObjectKeys: "passthrough",
                allowUnrecognizedUnionMembers: true,
                allowUnrecognizedEnumValues: true,
                skipValidation: true,
                breadcrumbsPrefix: ["response"],
            });
        }

        if (_response.error.reason === "status-code") {
            switch (_response.error.statusCode) {
                case 400:
                    throw new Schematic.BadRequestError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 401:
                    throw new Schematic.UnauthorizedError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 403:
                    throw new Schematic.ForbiddenError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 500:
                    throw new Schematic.InternalServerError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                default:
                    throw new errors.SchematicError({
                        statusCode: _response.error.statusCode,
                        body: _response.error.body,
                    });
            }
        }

        switch (_response.error.reason) {
            case "non-json":
                throw new errors.SchematicError({
                    statusCode: _response.error.statusCode,
                    body: _response.error.rawBody,
                });
            case "timeout":
                throw new errors.SchematicTimeoutError("Timeout exceeded when calling POST /checkout-internal.");
            case "unknown":
                throw new errors.SchematicError({
                    message: _response.error.errorMessage,
                });
        }
    }

    /**
     * @param {Schematic.CheckoutDataRequestBody} request
     * @param {Checkout.RequestOptions} requestOptions - Request-specific configuration.
     *
     * @throws {@link Schematic.BadRequestError}
     * @throws {@link Schematic.UnauthorizedError}
     * @throws {@link Schematic.ForbiddenError}
     * @throws {@link Schematic.InternalServerError}
     *
     * @example
     *     await client.checkout.getCheckoutData({
     *         companyId: "company_id"
     *     })
     */
    public async getCheckoutData(
        request: Schematic.CheckoutDataRequestBody,
        requestOptions?: Checkout.RequestOptions,
    ): Promise<Schematic.GetCheckoutDataResponse> {
        const _response = await (this._options.fetcher ?? core.fetcher)({
            url: urlJoin(
                (await core.Supplier.get(this._options.baseUrl)) ??
                    (await core.Supplier.get(this._options.environment)) ??
                    environments.SchematicEnvironment.Default,
                "checkout-internal/data",
            ),
            method: "POST",
            headers: {
                "X-Fern-Language": "JavaScript",
                "X-Fern-SDK-Name": "@schematichq/schematic-typescript-node",
                "X-Fern-SDK-Version": "1.1.10",
                "User-Agent": "@schematichq/schematic-typescript-node/1.1.10",
                "X-Fern-Runtime": core.RUNTIME.type,
                "X-Fern-Runtime-Version": core.RUNTIME.version,
                ...(await this._getCustomAuthorizationHeaders()),
                ...requestOptions?.headers,
            },
            contentType: "application/json",
            requestType: "json",
            body: serializers.CheckoutDataRequestBody.jsonOrThrow(request, { unrecognizedObjectKeys: "strip" }),
            timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
            maxRetries: requestOptions?.maxRetries,
            abortSignal: requestOptions?.abortSignal,
        });
        if (_response.ok) {
            return serializers.GetCheckoutDataResponse.parseOrThrow(_response.body, {
                unrecognizedObjectKeys: "passthrough",
                allowUnrecognizedUnionMembers: true,
                allowUnrecognizedEnumValues: true,
                skipValidation: true,
                breadcrumbsPrefix: ["response"],
            });
        }

        if (_response.error.reason === "status-code") {
            switch (_response.error.statusCode) {
                case 400:
                    throw new Schematic.BadRequestError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 401:
                    throw new Schematic.UnauthorizedError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 403:
                    throw new Schematic.ForbiddenError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 500:
                    throw new Schematic.InternalServerError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                default:
                    throw new errors.SchematicError({
                        statusCode: _response.error.statusCode,
                        body: _response.error.body,
                    });
            }
        }

        switch (_response.error.reason) {
            case "non-json":
                throw new errors.SchematicError({
                    statusCode: _response.error.statusCode,
                    body: _response.error.rawBody,
                });
            case "timeout":
                throw new errors.SchematicTimeoutError("Timeout exceeded when calling POST /checkout-internal/data.");
            case "unknown":
                throw new errors.SchematicError({
                    message: _response.error.errorMessage,
                });
        }
    }

    /**
     * @param {Schematic.ChangeSubscriptionInternalRequestBody} request
     * @param {Checkout.RequestOptions} requestOptions - Request-specific configuration.
     *
     * @throws {@link Schematic.BadRequestError}
     * @throws {@link Schematic.UnauthorizedError}
     * @throws {@link Schematic.ForbiddenError}
     * @throws {@link Schematic.InternalServerError}
     *
     * @example
     *     await client.checkout.previewCheckoutInternal({
     *         addOnIds: [{
     *                 addOnId: "add_on_id",
     *                 priceId: "price_id"
     *             }],
     *         companyId: "company_id",
     *         newPlanId: "new_plan_id",
     *         newPriceId: "new_price_id",
     *         payInAdvance: [{
     *                 priceId: "price_id",
     *                 quantity: 1
     *             }]
     *     })
     */
    public async previewCheckoutInternal(
        request: Schematic.ChangeSubscriptionInternalRequestBody,
        requestOptions?: Checkout.RequestOptions,
    ): Promise<Schematic.PreviewCheckoutInternalResponse> {
        const _response = await (this._options.fetcher ?? core.fetcher)({
            url: urlJoin(
                (await core.Supplier.get(this._options.baseUrl)) ??
                    (await core.Supplier.get(this._options.environment)) ??
                    environments.SchematicEnvironment.Default,
                "checkout-internal/preview",
            ),
            method: "POST",
            headers: {
                "X-Fern-Language": "JavaScript",
                "X-Fern-SDK-Name": "@schematichq/schematic-typescript-node",
                "X-Fern-SDK-Version": "1.1.10",
                "User-Agent": "@schematichq/schematic-typescript-node/1.1.10",
                "X-Fern-Runtime": core.RUNTIME.type,
                "X-Fern-Runtime-Version": core.RUNTIME.version,
                ...(await this._getCustomAuthorizationHeaders()),
                ...requestOptions?.headers,
            },
            contentType: "application/json",
            requestType: "json",
            body: serializers.ChangeSubscriptionInternalRequestBody.jsonOrThrow(request, {
                unrecognizedObjectKeys: "strip",
            }),
            timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
            maxRetries: requestOptions?.maxRetries,
            abortSignal: requestOptions?.abortSignal,
        });
        if (_response.ok) {
            return serializers.PreviewCheckoutInternalResponse.parseOrThrow(_response.body, {
                unrecognizedObjectKeys: "passthrough",
                allowUnrecognizedUnionMembers: true,
                allowUnrecognizedEnumValues: true,
                skipValidation: true,
                breadcrumbsPrefix: ["response"],
            });
        }

        if (_response.error.reason === "status-code") {
            switch (_response.error.statusCode) {
                case 400:
                    throw new Schematic.BadRequestError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 401:
                    throw new Schematic.UnauthorizedError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 403:
                    throw new Schematic.ForbiddenError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 500:
                    throw new Schematic.InternalServerError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                default:
                    throw new errors.SchematicError({
                        statusCode: _response.error.statusCode,
                        body: _response.error.body,
                    });
            }
        }

        switch (_response.error.reason) {
            case "non-json":
                throw new errors.SchematicError({
                    statusCode: _response.error.statusCode,
                    body: _response.error.rawBody,
                });
            case "timeout":
                throw new errors.SchematicTimeoutError(
                    "Timeout exceeded when calling POST /checkout-internal/preview.",
                );
            case "unknown":
                throw new errors.SchematicError({
                    message: _response.error.errorMessage,
                });
        }
    }

    /**
     * @param {string} subscriptionId - subscription_id
     * @param {Schematic.UpdateTrialEndRequestBody} request
     * @param {Checkout.RequestOptions} requestOptions - Request-specific configuration.
     *
     * @throws {@link Schematic.BadRequestError}
     * @throws {@link Schematic.UnauthorizedError}
     * @throws {@link Schematic.ForbiddenError}
     * @throws {@link Schematic.NotFoundError}
     * @throws {@link Schematic.InternalServerError}
     *
     * @example
     *     await client.checkout.updateCustomerSubscriptionTrialEnd("subscription_id")
     */
    public async updateCustomerSubscriptionTrialEnd(
        subscriptionId: string,
        request: Schematic.UpdateTrialEndRequestBody = {},
        requestOptions?: Checkout.RequestOptions,
    ): Promise<Schematic.UpdateCustomerSubscriptionTrialEndResponse> {
        const _response = await (this._options.fetcher ?? core.fetcher)({
            url: urlJoin(
                (await core.Supplier.get(this._options.baseUrl)) ??
                    (await core.Supplier.get(this._options.environment)) ??
                    environments.SchematicEnvironment.Default,
                `subscription/${encodeURIComponent(subscriptionId)}/edit-trial-end`,
            ),
            method: "PUT",
            headers: {
                "X-Fern-Language": "JavaScript",
                "X-Fern-SDK-Name": "@schematichq/schematic-typescript-node",
                "X-Fern-SDK-Version": "1.1.10",
                "User-Agent": "@schematichq/schematic-typescript-node/1.1.10",
                "X-Fern-Runtime": core.RUNTIME.type,
                "X-Fern-Runtime-Version": core.RUNTIME.version,
                ...(await this._getCustomAuthorizationHeaders()),
                ...requestOptions?.headers,
            },
            contentType: "application/json",
            requestType: "json",
            body: serializers.UpdateTrialEndRequestBody.jsonOrThrow(request, { unrecognizedObjectKeys: "strip" }),
            timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
            maxRetries: requestOptions?.maxRetries,
            abortSignal: requestOptions?.abortSignal,
        });
        if (_response.ok) {
            return serializers.UpdateCustomerSubscriptionTrialEndResponse.parseOrThrow(_response.body, {
                unrecognizedObjectKeys: "passthrough",
                allowUnrecognizedUnionMembers: true,
                allowUnrecognizedEnumValues: true,
                skipValidation: true,
                breadcrumbsPrefix: ["response"],
            });
        }

        if (_response.error.reason === "status-code") {
            switch (_response.error.statusCode) {
                case 400:
                    throw new Schematic.BadRequestError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 401:
                    throw new Schematic.UnauthorizedError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 403:
                    throw new Schematic.ForbiddenError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 404:
                    throw new Schematic.NotFoundError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                case 500:
                    throw new Schematic.InternalServerError(
                        serializers.ApiError.parseOrThrow(_response.error.body, {
                            unrecognizedObjectKeys: "passthrough",
                            allowUnrecognizedUnionMembers: true,
                            allowUnrecognizedEnumValues: true,
                            skipValidation: true,
                            breadcrumbsPrefix: ["response"],
                        }),
                    );
                default:
                    throw new errors.SchematicError({
                        statusCode: _response.error.statusCode,
                        body: _response.error.body,
                    });
            }
        }

        switch (_response.error.reason) {
            case "non-json":
                throw new errors.SchematicError({
                    statusCode: _response.error.statusCode,
                    body: _response.error.rawBody,
                });
            case "timeout":
                throw new errors.SchematicTimeoutError(
                    "Timeout exceeded when calling PUT /subscription/{subscription_id}/edit-trial-end.",
                );
            case "unknown":
                throw new errors.SchematicError({
                    message: _response.error.errorMessage,
                });
        }
    }

    protected async _getCustomAuthorizationHeaders() {
        const apiKeyValue = await core.Supplier.get(this._options.apiKey);
        return { "X-Schematic-Api-Key": apiKeyValue };
    }
}
