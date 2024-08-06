/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as environments from "../../../../environments";
import * as core from "../../../../core";
import * as Schematic from "../../../index";
import * as serializers from "../../../../serialization/index";
import urlJoin from "url-join";
import * as errors from "../../../../errors/index";

export declare namespace Crm {
  interface Options {
    environment?: core.Supplier<environments.SchematicEnvironment | string>;
    apiKey: core.Supplier<string>;
    fetcher?: core.FetchFunction;
  }

  interface RequestOptions {
    /** The maximum time to wait for a response in seconds. */
    timeoutInSeconds?: number;
    /** The number of times to retry the request. Defaults to 2. */
    maxRetries?: number;
    /** A hook to abort the request. */
    abortSignal?: AbortSignal;
  }
}

export class Crm {
  constructor(protected readonly _options: Crm.Options) {}

  /**
   * @param {Schematic.CreateCrmDealLineItemAssociationRequestBody} request
   * @param {Crm.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Schematic.BadRequestError}
   * @throws {@link Schematic.UnauthorizedError}
   * @throws {@link Schematic.ForbiddenError}
   * @throws {@link Schematic.InternalServerError}
   *
   * @example
   *     await client.crm.upsertDealLineItemAssociation({
   *         dealExternalId: "deal_external_id",
   *         lineItemExternalId: "line_item_external_id"
   *     })
   */
  public async upsertDealLineItemAssociation(
    request: Schematic.CreateCrmDealLineItemAssociationRequestBody,
    requestOptions?: Crm.RequestOptions,
  ): Promise<Schematic.UpsertDealLineItemAssociationResponse> {
    const _response = await (this._options.fetcher ?? core.fetcher)({
      url: urlJoin(
        (await core.Supplier.get(this._options.environment)) ?? environments.SchematicEnvironment.Default,
        "crm/associations/deal-line-item",
      ),
      method: "POST",
      headers: {
        "X-Fern-Language": "JavaScript",
        "X-Fern-SDK-Name": "@schematichq/schematic-typescript-node",
        "X-Fern-SDK-Version": "1.0.24",
        "X-Fern-Runtime": core.RUNTIME.type,
        "X-Fern-Runtime-Version": core.RUNTIME.version,
        ...(await this._getCustomAuthorizationHeaders()),
      },
      contentType: "application/json",
      requestType: "json",
      body: serializers.CreateCrmDealLineItemAssociationRequestBody.jsonOrThrow(request, {
        unrecognizedObjectKeys: "strip",
      }),
      timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
      maxRetries: requestOptions?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
    });
    if (_response.ok) {
      return serializers.UpsertDealLineItemAssociationResponse.parseOrThrow(_response.body, {
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
        throw new errors.SchematicTimeoutError();
      case "unknown":
        throw new errors.SchematicError({
          message: _response.error.errorMessage,
        });
    }
  }

  /**
   * @param {Schematic.CreateCrmLineItemRequestBody} request
   * @param {Crm.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Schematic.BadRequestError}
   * @throws {@link Schematic.UnauthorizedError}
   * @throws {@link Schematic.ForbiddenError}
   * @throws {@link Schematic.InternalServerError}
   *
   * @example
   *     await client.crm.upsertLineItem({
   *         amount: "amount",
   *         interval: "interval",
   *         lineItemExternalId: "line_item_external_id",
   *         productExternalId: "product_external_id",
   *         quantity: 1
   *     })
   */
  public async upsertLineItem(
    request: Schematic.CreateCrmLineItemRequestBody,
    requestOptions?: Crm.RequestOptions,
  ): Promise<Schematic.UpsertLineItemResponse> {
    const _response = await (this._options.fetcher ?? core.fetcher)({
      url: urlJoin(
        (await core.Supplier.get(this._options.environment)) ?? environments.SchematicEnvironment.Default,
        "crm/deal-line-item/upsert",
      ),
      method: "POST",
      headers: {
        "X-Fern-Language": "JavaScript",
        "X-Fern-SDK-Name": "@schematichq/schematic-typescript-node",
        "X-Fern-SDK-Version": "1.0.24",
        "X-Fern-Runtime": core.RUNTIME.type,
        "X-Fern-Runtime-Version": core.RUNTIME.version,
        ...(await this._getCustomAuthorizationHeaders()),
      },
      contentType: "application/json",
      requestType: "json",
      body: serializers.CreateCrmLineItemRequestBody.jsonOrThrow(request, { unrecognizedObjectKeys: "strip" }),
      timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
      maxRetries: requestOptions?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
    });
    if (_response.ok) {
      return serializers.UpsertLineItemResponse.parseOrThrow(_response.body, {
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
        throw new errors.SchematicTimeoutError();
      case "unknown":
        throw new errors.SchematicError({
          message: _response.error.errorMessage,
        });
    }
  }

  /**
   * @param {Schematic.CreateCrmDealRequestBody} request
   * @param {Crm.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Schematic.BadRequestError}
   * @throws {@link Schematic.UnauthorizedError}
   * @throws {@link Schematic.ForbiddenError}
   * @throws {@link Schematic.InternalServerError}
   *
   * @example
   *     await client.crm.upsertCrmDeal({
   *         crmCompanyKey: "crm_company_key",
   *         crmType: "crm_type",
   *         dealExternalId: "deal_external_id"
   *     })
   */
  public async upsertCrmDeal(
    request: Schematic.CreateCrmDealRequestBody,
    requestOptions?: Crm.RequestOptions,
  ): Promise<Schematic.UpsertCrmDealResponse> {
    const _response = await (this._options.fetcher ?? core.fetcher)({
      url: urlJoin(
        (await core.Supplier.get(this._options.environment)) ?? environments.SchematicEnvironment.Default,
        "crm/deals/upsert",
      ),
      method: "POST",
      headers: {
        "X-Fern-Language": "JavaScript",
        "X-Fern-SDK-Name": "@schematichq/schematic-typescript-node",
        "X-Fern-SDK-Version": "1.0.24",
        "X-Fern-Runtime": core.RUNTIME.type,
        "X-Fern-Runtime-Version": core.RUNTIME.version,
        ...(await this._getCustomAuthorizationHeaders()),
      },
      contentType: "application/json",
      requestType: "json",
      body: serializers.CreateCrmDealRequestBody.jsonOrThrow(request, { unrecognizedObjectKeys: "strip" }),
      timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
      maxRetries: requestOptions?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
    });
    if (_response.ok) {
      return serializers.UpsertCrmDealResponse.parseOrThrow(_response.body, {
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
        throw new errors.SchematicTimeoutError();
      case "unknown":
        throw new errors.SchematicError({
          message: _response.error.errorMessage,
        });
    }
  }

  /**
   * @param {Schematic.ListCrmProductsRequest} request
   * @param {Crm.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Schematic.BadRequestError}
   * @throws {@link Schematic.UnauthorizedError}
   * @throws {@link Schematic.ForbiddenError}
   * @throws {@link Schematic.InternalServerError}
   *
   * @example
   *     await client.crm.listCrmProducts()
   */
  public async listCrmProducts(
    request: Schematic.ListCrmProductsRequest = {},
    requestOptions?: Crm.RequestOptions,
  ): Promise<Schematic.ListCrmProductsResponse> {
    const { ids, name, limit, offset } = request;
    const _queryParams: Record<string, string | string[] | object | object[]> = {};
    if (ids != null) {
      if (Array.isArray(ids)) {
        _queryParams["ids"] = ids.map((item) => item);
      } else {
        _queryParams["ids"] = ids;
      }
    }

    if (name != null) {
      _queryParams["name"] = name;
    }

    if (limit != null) {
      _queryParams["limit"] = limit.toString();
    }

    if (offset != null) {
      _queryParams["offset"] = offset.toString();
    }

    const _response = await (this._options.fetcher ?? core.fetcher)({
      url: urlJoin(
        (await core.Supplier.get(this._options.environment)) ?? environments.SchematicEnvironment.Default,
        "crm/products",
      ),
      method: "GET",
      headers: {
        "X-Fern-Language": "JavaScript",
        "X-Fern-SDK-Name": "@schematichq/schematic-typescript-node",
        "X-Fern-SDK-Version": "1.0.24",
        "X-Fern-Runtime": core.RUNTIME.type,
        "X-Fern-Runtime-Version": core.RUNTIME.version,
        ...(await this._getCustomAuthorizationHeaders()),
      },
      contentType: "application/json",
      queryParameters: _queryParams,
      requestType: "json",
      timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
      maxRetries: requestOptions?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
    });
    if (_response.ok) {
      return serializers.ListCrmProductsResponse.parseOrThrow(_response.body, {
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
        throw new errors.SchematicTimeoutError();
      case "unknown":
        throw new errors.SchematicError({
          message: _response.error.errorMessage,
        });
    }
  }

  /**
   * @param {Schematic.CreateCrmProductRequestBody} request
   * @param {Crm.RequestOptions} requestOptions - Request-specific configuration.
   *
   * @throws {@link Schematic.BadRequestError}
   * @throws {@link Schematic.UnauthorizedError}
   * @throws {@link Schematic.ForbiddenError}
   * @throws {@link Schematic.InternalServerError}
   *
   * @example
   *     await client.crm.upsertCrmProduct({
   *         currency: "currency",
   *         description: "description",
   *         externalId: "external_id",
   *         interval: "interval",
   *         name: "name",
   *         price: "price",
   *         quantity: 1,
   *         sku: "sku"
   *     })
   */
  public async upsertCrmProduct(
    request: Schematic.CreateCrmProductRequestBody,
    requestOptions?: Crm.RequestOptions,
  ): Promise<Schematic.UpsertCrmProductResponse> {
    const _response = await (this._options.fetcher ?? core.fetcher)({
      url: urlJoin(
        (await core.Supplier.get(this._options.environment)) ?? environments.SchematicEnvironment.Default,
        "crm/products/upsert",
      ),
      method: "POST",
      headers: {
        "X-Fern-Language": "JavaScript",
        "X-Fern-SDK-Name": "@schematichq/schematic-typescript-node",
        "X-Fern-SDK-Version": "1.0.24",
        "X-Fern-Runtime": core.RUNTIME.type,
        "X-Fern-Runtime-Version": core.RUNTIME.version,
        ...(await this._getCustomAuthorizationHeaders()),
      },
      contentType: "application/json",
      requestType: "json",
      body: serializers.CreateCrmProductRequestBody.jsonOrThrow(request, { unrecognizedObjectKeys: "strip" }),
      timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
      maxRetries: requestOptions?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
    });
    if (_response.ok) {
      return serializers.UpsertCrmProductResponse.parseOrThrow(_response.body, {
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
        throw new errors.SchematicTimeoutError();
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
