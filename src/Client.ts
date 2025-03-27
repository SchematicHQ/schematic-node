/**
 * This file was auto-generated by Fern from our API Definition.
 */

import * as environments from "./environments";
import * as core from "./core";
import { Accounts } from "./api/resources/accounts/client/Client";
import { Features } from "./api/resources/features/client/Client";
import { Billing } from "./api/resources/billing/client/Client";
import { Checkout } from "./api/resources/checkout/client/Client";
import { Companies } from "./api/resources/companies/client/Client";
import { Entitlements } from "./api/resources/entitlements/client/Client";
import { Plans } from "./api/resources/plans/client/Client";
import { Components } from "./api/resources/components/client/Client";
import { Crm } from "./api/resources/crm/client/Client";
import { Events } from "./api/resources/events/client/Client";
import { Plangroups } from "./api/resources/plangroups/client/Client";
import { Accesstokens } from "./api/resources/accesstokens/client/Client";
import { Webhooks } from "./api/resources/webhooks/client/Client";

export declare namespace SchematicClient {
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

export class SchematicClient {
    protected _accounts: Accounts | undefined;
    protected _features: Features | undefined;
    protected _billing: Billing | undefined;
    protected _checkout: Checkout | undefined;
    protected _companies: Companies | undefined;
    protected _entitlements: Entitlements | undefined;
    protected _plans: Plans | undefined;
    protected _components: Components | undefined;
    protected _crm: Crm | undefined;
    protected _events: Events | undefined;
    protected _plangroups: Plangroups | undefined;
    protected _accesstokens: Accesstokens | undefined;
    protected _webhooks: Webhooks | undefined;

    constructor(protected readonly _options: SchematicClient.Options) {}

    public get accounts(): Accounts {
        return (this._accounts ??= new Accounts(this._options));
    }

    public get features(): Features {
        return (this._features ??= new Features(this._options));
    }

    public get billing(): Billing {
        return (this._billing ??= new Billing(this._options));
    }

    public get checkout(): Checkout {
        return (this._checkout ??= new Checkout(this._options));
    }

    public get companies(): Companies {
        return (this._companies ??= new Companies(this._options));
    }

    public get entitlements(): Entitlements {
        return (this._entitlements ??= new Entitlements(this._options));
    }

    public get plans(): Plans {
        return (this._plans ??= new Plans(this._options));
    }

    public get components(): Components {
        return (this._components ??= new Components(this._options));
    }

    public get crm(): Crm {
        return (this._crm ??= new Crm(this._options));
    }

    public get events(): Events {
        return (this._events ??= new Events(this._options));
    }

    public get plangroups(): Plangroups {
        return (this._plangroups ??= new Plangroups(this._options));
    }

    public get accesstokens(): Accesstokens {
        return (this._accesstokens ??= new Accesstokens(this._options));
    }

    public get webhooks(): Webhooks {
        return (this._webhooks ??= new Webhooks(this._options));
    }
}
