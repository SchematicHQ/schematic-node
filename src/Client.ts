/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as environments from "./environments";
import * as core from "./core";
import urlJoin from "url-join";
import * as errors from "./errors/index";
import { Accounts } from "./api/resources/accounts/client/Client";
import { Features } from "./api/resources/features/client/Client";
import { Billing } from "./api/resources/billing/client/Client";
import { Companies } from "./api/resources/companies/client/Client";
import { Entitlements } from "./api/resources/entitlements/client/Client";
import { Components } from "./api/resources/components/client/Client";
import { Crm } from "./api/resources/crm/client/Client";
import { Events } from "./api/resources/events/client/Client";
import { Plans } from "./api/resources/plans/client/Client";
import { Plangroups } from "./api/resources/plangroups/client/Client";
import { Accesstokens } from "./api/resources/accesstokens/client/Client";
import { Webhooks } from "./api/resources/webhooks/client/Client";

export declare namespace SchematicClient {
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

export class SchematicClient {
    constructor(protected readonly _options: SchematicClient.Options) {}

    /**
     * @param {SchematicClient.RequestOptions} requestOptions - Request-specific configuration.
     *
     * @example
     *     await client.getCompanyPlans()
     */
    public async getCompanyPlans(requestOptions?: SchematicClient.RequestOptions): Promise<void> {
        const _response = await (this._options.fetcher ?? core.fetcher)({
            url: urlJoin(
                (await core.Supplier.get(this._options.environment)) ?? environments.SchematicEnvironment.Default,
                "company-plans"
            ),
            method: "GET",
            headers: {
                "X-Fern-Language": "JavaScript",
                "X-Fern-SDK-Name": "@schematichq/schematic-typescript-node",
                "X-Fern-SDK-Version": "1.1.7",
                "User-Agent": "@schematichq/schematic-typescript-node/1.1.7",
                "X-Fern-Runtime": core.RUNTIME.type,
                "X-Fern-Runtime-Version": core.RUNTIME.version,
                ...(await this._getCustomAuthorizationHeaders()),
            },
            contentType: "application/json",
            requestType: "json",
            timeoutMs: requestOptions?.timeoutInSeconds != null ? requestOptions.timeoutInSeconds * 1000 : 60000,
            maxRetries: requestOptions?.maxRetries,
            abortSignal: requestOptions?.abortSignal,
        });
        if (_response.ok) {
            return;
        }

        if (_response.error.reason === "status-code") {
            throw new errors.SchematicError({
                statusCode: _response.error.statusCode,
                body: _response.error.body,
            });
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

    protected _accounts: Accounts | undefined;

    public get accounts(): Accounts {
        return (this._accounts ??= new Accounts(this._options));
    }

    protected _features: Features | undefined;

    public get features(): Features {
        return (this._features ??= new Features(this._options));
    }

    protected _billing: Billing | undefined;

    public get billing(): Billing {
        return (this._billing ??= new Billing(this._options));
    }

    protected _companies: Companies | undefined;

    public get companies(): Companies {
        return (this._companies ??= new Companies(this._options));
    }

    protected _entitlements: Entitlements | undefined;

    public get entitlements(): Entitlements {
        return (this._entitlements ??= new Entitlements(this._options));
    }

    protected _components: Components | undefined;

    public get components(): Components {
        return (this._components ??= new Components(this._options));
    }

    protected _crm: Crm | undefined;

    public get crm(): Crm {
        return (this._crm ??= new Crm(this._options));
    }

    protected _events: Events | undefined;

    public get events(): Events {
        return (this._events ??= new Events(this._options));
    }

    protected _plans: Plans | undefined;

    public get plans(): Plans {
        return (this._plans ??= new Plans(this._options));
    }

    protected _plangroups: Plangroups | undefined;

    public get plangroups(): Plangroups {
        return (this._plangroups ??= new Plangroups(this._options));
    }

    protected _accesstokens: Accesstokens | undefined;

    public get accesstokens(): Accesstokens {
        return (this._accesstokens ??= new Accesstokens(this._options));
    }

    protected _webhooks: Webhooks | undefined;

    public get webhooks(): Webhooks {
        return (this._webhooks ??= new Webhooks(this._options));
    }

    protected async _getCustomAuthorizationHeaders() {
        const apiKeyValue = await core.Supplier.get(this._options.apiKey);
        return { "X-Schematic-Api-Key": apiKeyValue };
    }
}
