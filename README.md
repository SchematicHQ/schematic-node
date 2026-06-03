# Schematic Typescript Node SDK

## Installation and Setup

1. Install the TypeScript library using your package manager of choice:

```bash
npm install @schematichq/schematic-typescript-node
# or
yarn add @schematichq/schematic-typescript-node
# or
pnpm add @schematichq/schematic-typescript-node
```

2. [Issue an API key](https://docs.schematichq.com/quickstart#create-an-api-key) for the appropriate environment using the [Schematic app](https://app.schematichq.com/settings/api-keys). Be sure to capture the secret key when you issue the API key; you'll only see this key once, and this is what you'll use with schematic-typescript-node.

3. Using this secret key, initialize a client in your application:

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({ apiKey });

// interactions with the client

client.close();
```

By default, the client will do some local caching for flag checks. If you would like to change this behavior, you can do so using an initialization option to specify the max size of the cache (in terms of number of records) and the max age of the cache (in milliseconds):

```ts
import { LocalCache, SchematicClient, type CheckFlagWithEntitlementResponse } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const cacheSize = 100;
const cacheTTL = 1000; // in milliseconds
const client = new SchematicClient({
    apiKey,
    cacheProviders: {
        flagChecks: [new LocalCache<CheckFlagWithEntitlementResponse>({ maxItems: cacheSize, ttl: cacheTTL })],
    },
});

// interactions with the client

client.close();
```

You can also disable local caching entirely with an initialization option; bear in mind that, in this case, every flag check will result in a network request:

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({
    apiKey,
    cacheProviders: {
        flagChecks: [],
    },
});

// interactions with the client

client.close();
```

You may want to specify default flag values for your application, which will be used if there is a service interruption or if the client is running in offline mode (see below). You can do this using an initialization option:

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({
    apiKey,
    flagDefaults: {
        "some-flag-key": true,
    },
});

// interactions with the client

client.close();
```

### Custom Logging

You can provide your own logger implementation to control how the Schematic client logs messages. The logger must implement the `Logger` interface with `error`, `warn`, `info`, and `debug` methods:

```ts
import { SchematicClient, Logger } from "@schematichq/schematic-typescript-node";

// Example using a custom logger (could be Winston, Pino, etc.)
class CustomLogger implements Logger {
    error(message: string, ...args: any[]): void {
        // Your custom error logging logic
        console.error(`[ERROR] ${message}`, ...args);
    }

    warn(message: string, ...args: any[]): void {
        // Your custom warning logging logic
        console.warn(`[WARN] ${message}`, ...args);
    }

    info(message: string, ...args: any[]): void {
        // Your custom info logging logic
        console.info(`[INFO] ${message}`, ...args);
    }

    debug(message: string, ...args: any[]): void {
        // Your custom debug logging logic
        console.debug(`[DEBUG] ${message}`, ...args);
    }
}

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({
    apiKey,
    logger: new CustomLogger(),
});

// interactions with the client

client.close();
```

Example using a popular logging library like Winston:

```ts
import winston from 'winston';
import { SchematicClient } from "@schematichq/schematic-typescript-node";

// Create a Winston logger instance
const winstonLogger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
    ]
});

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({
    apiKey,
    logger: winstonLogger, // Winston logger directly implements the Logger interface
});

// interactions with the client

client.close();
```

If no logger is provided, the client uses a default console logger. By default it only emits `warn` and `error` messages; `debug` and `info` are suppressed to keep production output quiet. Use the `logLevel` option to raise or lower the verbosity of the default logger:

```ts
import { SchematicClient, LogLevel } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({
    apiKey,
    logLevel: "debug", // or LogLevel.Debug — emit all levels (debug, info, warn, error)
});
```

The `logLevel` option only affects the default console logger. When you supply your own `logger`, its level configuration is respected as-is and `logLevel` is ignored.

## Usage examples

A number of these examples use `keys` to identify companies and users. Learn more about keys [here](https://docs.schematichq.com/developer_resources/key_management).

### Sending identify events

Create or update users and companies using identify events.

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({ apiKey });

client.identify({
    company: {
        keys: { id: "your-company-id" },
        name: "Acme, Inc.",
        traits: { city: "Atlanta" },
    },
    keys: {
        email: "wcoyote@acme.net",
        userId: "your-user-id",
    },
    name: "Wile E. Coyote",
    traits: {
        enemy: "Bugs Bunny",
        loginCount: 24,
        isStaff: false,
    },
});

client.close();
```

This call is non-blocking and there is no response to check.

### Sending track events

Track activity in your application using track events; these events can later be used to produce metrics for targeting.

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({ apiKey });

client.track({
    event: "some-action",
    company: {
        id: "your-company-id",
    },
    user: {
        email: "wcoyote@acme.net",
        userId: "your-user-id",
    },
});

client.close();
```

This call is non-blocking and there is no response to check.

If you want to record large numbers of the same event at once, or perhaps measure usage in terms of a unit like tokens or memory, you can optionally specify a quantity for your event:

```ts
client.track({
    event: "some-action",
    company: {
        id: "your-company-id",
    },
    user: {
        email: "wcoyote@acme.net",
        userId: "your-user-id",
    },
    quantity: 10,
});
```

Both `track` and `identify` accept an optional second argument for event metadata. Supply an `idempotencyKey` to deduplicate events (duplicates with the same key, scoped to the environment, are dropped server-side for 24 hours):

```ts
client.track(
    {
        event: "some-action",
        company: { id: "your-company-id" },
    },
    { idempotencyKey: "your-unique-key" },
);

client.identify(
    {
        keys: { userId: "your-user-id" },
        name: "Wile E. Coyote",
    },
    { idempotencyKey: "your-unique-key" },
);
```

For `track`, you can also set a trusted client clock to use your own timestamp as the effective event time, and backfill historical data without affecting billing. Both require a secret API key:

```ts
client.track(
    {
        event: "some-action",
        company: { id: "your-company-id" },
    },
    {
        sentAt: new Date("2026-01-01T00:00:00Z"),
        trustedClientClock: true,
        backfill: true,
    },
);
```

### Creating and updating companies

Although it is faster to create companies and users via identify events, if you need to handle a response, you can use the companies API to upsert companies. Because you use your own identifiers to identify companies, rather than a Schematic company ID, creating and updating companies are both done via the same upsert operation:

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({ apiKey });

const body = {
    keys: {
        id: "your-company-id",
    },
    name: "Acme Widgets, Inc.",
    traits: {
        city: "Atlanta",
        highScore: 25,
        isActive: true,
    },
};

client.companies
    .upsertCompany(body)
    .then((response) => {
        console.log(response.data);
    })
    .catch(console.error);

client.close();
```

You can define any number of company keys; these are used to address the company in the future, for example by updating the company's traits or checking a flag for the company.

You can also define any number of company traits; these can then be used as targeting parameters.

### Creating and updating users

Similarly, you can upsert users using the Schematic API, as an alternative to using identify events. Because you use your own identifiers to identify users, rather than a Schematic user ID, creating and updating users are both done via the same upsert operation:

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({ apiKey });

const body = {
    keys: {
        email: "wcoyote@acme.net",
        userId: "your-user-id",
    },
    company: { id: "your-company-id" },
    name: "Wile E. Coyote",
    traits: {
        city: "Atlanta",
        loginCount: 24,
        isStaff: false,
    },
};

client.companies
    .upsertUser(body)
    .then((response) => {
        console.log(response.data);
    })
    .catch(console.error);

client.close();
```

You can define any number of user keys; these are used to address the user in the future, for example by updating the user's traits or checking a flag for the user.

You can also define any number of user traits; these can then be used as targeting parameters.

### Checking flags

When checking a flag, you'll provide keys for a company and/or keys for a user. You can also provide no keys at all, in which case you'll get the default value for the flag.

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({ apiKey });

const evaluationCtx = {
    company: { id: "your-company-id" },
    user: {
        email: "wcoyote@acme.net",
        userId: "your-user-id",
    },
};

client
    .checkFlag(evaluationCtx, "some-flag-key")
    .then((isFlagOn) => {
        if (isFlagOn) {
            // Flag is on
        } else {
            // Flag is off
        }
    })
    .catch(console.error);

client.close();
```

### Checking flags with entitlement details

If you need more detail about how a flag check was resolved, including any entitlement associated with the check, use `checkFlagWithEntitlement`. This returns a response object with the flag value, the reason for the evaluation result, and entitlement details such as usage, allocation, and credit balances when applicable.

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({ apiKey });

const evaluationCtx = {
    company: { id: "your-company-id" },
    user: {
        email: "wcoyote@acme.net",
        userId: "your-user-id",
    },
};

client
    .checkFlagWithEntitlement(evaluationCtx, "some-flag-key")
    .then((resp) => {
        console.log(`Flag: ${resp.flagKey}, Value: ${resp.value}, Reason: ${resp.reason}`);

        if (resp.entitlement) {
            console.log(`Entitlement type: ${resp.entitlement.valueType}`);
            console.log(`Usage: ${resp.entitlement.usage}, Allocation: ${resp.entitlement.allocation}`);
            console.log(`Credit remaining: ${resp.entitlement.creditRemaining}`);
        }
    })
    .catch(console.error);

client.close();
```

### Checking multiple flags

The `checkFlags` method allows you to efficiently check multiple feature flags in a single operation. When you provide specific flag keys, it will only return the flag values for those flags, leveraging intelligent caching to minimize API calls.

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const client = new SchematicClient({ apiKey });

const evaluationCtx = {
    company: { id: "your-company-id" },
};

// Check specific flags by providing an array of flag keys
client
    .checkFlags(evaluationCtx, ["feature-flag-1", "feature-flag-2", "feature-flag-3"])
    .then((flagResults) => {
        flagResults.forEach((result) => {
            console.log(`Flag ${result.flag}: ${result.value} (${result.reason})`);
            if (result.value) {
                // This flag is enabled
            } else {
                // This flag is disabled
            }
        });
    })
    .catch(console.error);

// Or check all available flags by omitting the keys parameter
client
    .checkFlags(evaluationCtx)
    .then((flagResults) => {
        flagResults.forEach((result) => {
            console.log(`Flag ${result.flag}: ${result.value}`);
        });
    })
    .catch(console.error);

client.close();
```

### Other API operations

The Schematic API supports many operations beyond these, accessible via the API modules on the client, `Accounts`, `Billing`, `Companies`, `Entitlements`, `Events`, `Features`, and `Plans`.

## Webhook Verification

Schematic can send webhooks to notify your application of events. To ensure the security of these webhooks, Schematic signs each request using HMAC-SHA256. The SDK provides utility functions to verify these signatures.

### Verifying Webhook Signatures

When your application receives a webhook request from Schematic, you should verify its signature to ensure it's authentic. The SDK provides simple functions to verify webhook signatures. Here's how to use them in different frameworks:

#### Express

```ts
import express from "express";
import {
    verifyWebhookSignature,
    WebhookSignatureError,
    WEBHOOK_SIGNATURE_HEADER,
    WEBHOOK_TIMESTAMP_HEADER,
} from "@schematichq/schematic-typescript-node";

// Note: Schematic webhooks use these headers:
// - X-Schematic-Webhook-Signature: Contains the HMAC-SHA256 signature
// - X-Schematic-Webhook-Timestamp: Contains the timestamp when the webhook was sent

const app = express();

// Use a middleware that captures raw body for signature verification
app.use(
    "/webhooks/schematic",
    express.json({
        verify: (req, res, buf) => {
            if (buf && buf.length) {
                (req as any).rawBody = buf;
            }
        },
    })
);

app.post("/webhooks/schematic", (req, res) => {
    try {
        const webhookSecret = "your-webhook-secret"; // Get this from the Schematic app

        // Verify the webhook signature using the captured raw body
        verifyWebhookSignature(req, webhookSecret);

        // Process the webhook payload
        const data = req.body;
        console.log("Webhook verified:", data);

        res.status(200).end();
    } catch (error) {
        if (error instanceof WebhookSignatureError) {
            console.error("Webhook verification failed:", error.message);
            return res.status(400).json({ error: error.message });
        }

        console.error("Error processing webhook:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

#### Node HTTP Server

```ts
import http from "http";
import {
    verifySignature,
    WebhookSignatureError,
    WEBHOOK_SIGNATURE_HEADER,
    WEBHOOK_TIMESTAMP_HEADER,
} from "@schematichq/schematic-typescript-node";

const webhookSecret = "your-webhook-secret"; // Get this from the Schematic app

const server = http.createServer(async (req, res) => {
    if (req.url === "/webhooks/schematic" && req.method === "POST") {
        // Collect the request body
        let body = "";
        for await (const chunk of req) {
            body += chunk.toString();
        }

        try {
            // Get the headers
            const signature = req.headers[WEBHOOK_SIGNATURE_HEADER.toLowerCase()] as string;
            const timestamp = req.headers[WEBHOOK_TIMESTAMP_HEADER.toLowerCase()] as string;

            // Verify the signature
            verifySignature(body, signature, timestamp, webhookSecret);

            // Process the webhook payload
            const data = JSON.parse(body);
            console.log("Webhook verified:", data);

            res.statusCode = 200;
            res.end();
        } catch (error) {
            if (error instanceof WebhookSignatureError) {
                console.error("Webhook verification failed:", error.message);
                res.statusCode = 400;
                res.end(JSON.stringify({ error: error.message }));
                return;
            }

            console.error("Error processing webhook:", error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "Internal server error" }));
        }
    } else {
        res.statusCode = 404;
        res.end();
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

#### Next.js API Routes

```ts
// pages/api/webhooks/schematic.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
    verifyWebhookSignature,
    WebhookSignatureError,
    WEBHOOK_SIGNATURE_HEADER,
    WEBHOOK_TIMESTAMP_HEADER,
} from "@schematichq/schematic-typescript-node";
import { buffer } from "micro";

// Schematic webhooks use these headers:
// - X-Schematic-Webhook-Signature: Contains the HMAC-SHA256 signature
// - X-Schematic-Webhook-Timestamp: Contains the timestamp when the webhook was sent

// Disable body parsing to get the raw body
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).end("Method not allowed");
    }

    try {
        const webhookSecret = process.env.SCHEMATIC_WEBHOOK_SECRET!;
        const rawBody = await buffer(req);

        // Verify the webhook signature
        verifyWebhookSignature(req, webhookSecret, rawBody);

        // Parse the webhook payload
        const payload = JSON.parse(rawBody.toString());
        console.log("Webhook verified:", payload);

        // Process the webhook event
        // ...

        res.status(200).end();
    } catch (error) {
        if (error instanceof WebhookSignatureError) {
            console.error("Webhook verification failed:", error.message);
            return res.status(400).json({ error: error.message });
        }

        console.error("Error processing webhook:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
```

## Caching

### Local Caching

By default, the client will do some local caching for flag checks. You can customize this behavior by specifying the max size of the cache and the max age of the cache (in milliseconds) as shown in the setup section above.

### Cloudflare KV Caching

If you're using Cloudflare Workers, you can leverage Cloudflare's KV storage for caching flag check results. This provides a more persistent and distributed cache compared to the local in-memory cache.

To use Cloudflare KV caching, you'll need to install the Cloudflare adapter package:

```bash
npm install @schematichq/schematic-typescript-cloudflare
# or
yarn add @schematichq/schematic-typescript-cloudflare
# or
pnpm add @schematichq/schematic-typescript-cloudflare
```

Then, in your Cloudflare Worker, you can set up the client with KV caching:

```typescript
import { SchematicClient } from "@schematichq/schematic-typescript-node";
import { CloudflareKVCache } from "@schematichq/schematic-typescript-cloudflare";

// Inside a Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    // Create a CloudflareKVCache instance
    const cache = new CloudflareKVCache<boolean>(env.MY_KV_NAMESPACE, {
      ttl: 1000 * 60 * 60, // 1 hour cache TTL
      keyPrefix: 'schematic:', // Optional prefix for KV keys
    });

    // Initialize Schematic with the KV cache
    const schematic = new SchematicClient({
      apiKey: env.SCHEMATIC_API_KEY,
      cacheProviders: {
        flagChecks: [cache],
      }
    });

    // Your application logic...
    // ...

    // Don't forget to close the client when done
    schematic.close();
  }
};
```

The CloudflareKVCache constructor accepts the following options:
- `ttl`: Time-to-live for cache entries in milliseconds (default: 5000ms)
- `keyPrefix`: Prefix to add to all KV keys (default: 'schematic:')

With this setup, flag check results will be cached in your Cloudflare KV namespace, allowing for persistence across worker invocations and global distribution of your cache.

## DataStream

DataStream enables local flag evaluation by maintaining a WebSocket connection to Schematic and caching flag rules, company, and user data locally.

> **Runtime compatibility:** DataStream requires Node.js APIs (`WebSocket`, `EventEmitter`) and is not supported in edge runtimes such as Cloudflare Workers, Vercel Edge Functions, or Deno Deploy. For these runtimes, use [Replicator Mode](#replicator-mode) instead.

### Setup

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const client = new SchematicClient({
    apiKey: process.env.SCHEMATIC_API_KEY,
    useDataStream: true,
});

// Flag checks are now evaluated locally
const flagValue = await client.checkFlag(
    { company: { id: "your-company-id" } },
    "some-flag-key",
);

client.close();
```

### Configuration options

| Option | Type | Default | Description |
|---|---|---|---|
| `cacheTTL` | `number` | 24 hours | Cache TTL in milliseconds |
| `redisClient` | `RedisClient` | — | Redis client for shared caching (uses in-memory cache if not provided) |
| `redisKeyPrefix` | `string` | `schematic:` | Key prefix for Redis cache entries |

```ts
import { createClient } from "redis";
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const redisClient = createClient({ url: "redis://localhost:6379" });
await redisClient.connect();

const client = new SchematicClient({
    apiKey: process.env.SCHEMATIC_API_KEY,
    useDataStream: true,
    dataStream: {
        redisClient,
        redisKeyPrefix: "schematic:",
        cacheTTL: 60 * 60 * 1000, // 1 hour
    },
});
```

## Replicator Mode

Replicator mode is designed for environments where a separate process (the replicator) manages the WebSocket connection and populates a shared cache. The SDK reads from that cache and evaluates flags locally without establishing its own WebSocket connection.

### Requirements

Replicator mode requires a shared cache (Redis or custom cache providers) so the SDK can read data written by the external replicator process.

### Setup

```ts
import { createClient } from "redis";
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const redisClient = createClient({ url: "redis://localhost:6379" });
await redisClient.connect();

const client = new SchematicClient({
    apiKey: process.env.SCHEMATIC_API_KEY,
    useDataStream: true,
    dataStream: {
        replicatorMode: true,
        redisClient,
        replicatorHealthURL: "http://localhost:8080/health",
        replicatorHealthCheck: 30000, // 30 seconds
    },
});
```

### Configuration options

| Option | Type | Default | Description |
|---|---|---|---|
| `replicatorMode` | `boolean` | `false` | Enable replicator mode |
| `redisClient` | `RedisClient` | — | **Required.** Redis client for reading from the shared cache |
| `redisKeyPrefix` | `string` | `schematic:` | Key prefix for Redis cache entries |
| `replicatorHealthURL` | `string` | — | URL to poll for replicator health status |
| `replicatorHealthCheck` | `number` | 30000 | Health check polling interval in milliseconds |
| `cacheTTL` | `number` | 24 hours | Cache TTL in milliseconds |

## Credit Leases and Reservations

For features metered by credit burndown (e.g. inference tokens), the SDK can enforce credit balances locally — without a Schematic API call on every check — using a lease-and-reservation system:

- A **lease** is a tranche of credits acquired transactionally from Schematic's API. It functions as a hold against the company's credit balance until it is consumed, released, or expires.
- A **reservation** is a client-side hold carved out of the lease at check time, sized to the upper bound of the operation's usage. This protects against races and over-spend between the check and the eventual usage report.
- When the work completes, a track call reports actual usage; the difference between reserved and actual usage is refunded to the lease.

> **Requirements:** Credit leases require [DataStream](#datastream) (or [Replicator Mode](#replicator-mode)) — lease-bearing checks are evaluated locally against cached flag and company state. In a horizontally-scaled deployment, a shared Redis backend is also required so that all SDK instances gate against the same lease balance; without one, lease state is per-process.

### Setup

```ts
import { createClient } from "redis";
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const redisClient = createClient({ url: "redis://localhost:6379" });
await redisClient.connect();

const client = new SchematicClient({
    apiKey: process.env.SCHEMATIC_API_KEY,
    useDataStream: true,
    dataStream: {
        redisClient, // also backs lease + reservation state automatically
    },
    creditLeases: {
        defaultLeaseDuration: 5 * 60 * 1000, // lease lifetime (ms)
        defaultReservationTTL: 60 * 1000, // how long a reservation is held if not settled by a track (ms)
        defaultLeaseSize: 10_000, // credits requested per lease
        lowWaterMark: 0.25, // extend the lease in the background when its balance dips below this fraction
    },
});
```

When `dataStream.redisClient` is configured, lease and reservation state automatically lives in the same Redis, with atomic reservations driven by Lua scripts — no additional configuration needed. To point lease state at a *different* Redis, set `creditLeases.redisClient` explicitly.

### Checking and tracking

`check()` reserves the operation's upper-bound usage against the lease and returns a reservation handle; `trackWithReservation()` settles it with actual usage:

```ts
// Per-request: reserve up to maxTokens against the lease.
const result = await client.check(
    { company: { id: "your-company-id" } },
    "inference",
    {
        usage: maxTokens, // upper bound for this operation
        eventSubtype: "inference_tokens", // the metered event
    },
);
if (!result.allowed) {
    throw new Error("credit balance exceeded");
}

const inference = await runInference(/* ... */);

// Report actual usage; the unused slice of the reservation is refunded to the lease.
await client.trackWithReservation(result.reservation!, inference.tokensUsed);
```

If the caller never settles a reservation, it expires after `defaultReservationTTL` and its credits are returned to the lease. If the work outlives the reservation's TTL, `trackWithReservation` still bills the usage — the track event carries a deterministic idempotency key, so duplicate or recovery emits never double-bill. However, the local lease balance is not re-debited on that late settle (the expired reservation's hold was already swept back to the lease), so it reads high until the lease rolls over. **Set `defaultReservationTTL` above the longest expected gap between `check()` and `trackWithReservation()`** to keep the local balance accurate.

### Pre-warming

To avoid paying the lease-acquire round trip on a session's first check, pre-warm leases when the user is identified:

```ts
await client.identify(
    {
        keys: { userId: "your-user-id" },
        company: { keys: { id: "your-company-id" } },
    },
    { prewarm: ["credit-type-id"] }, // credit type IDs to acquire leases for
);
```

Or call `client.prewarm(evalCtx, creditTypeIds)` directly.

### Failure behavior

By default, a check that cannot be gated (API unreachable, Redis down, lease exhausted) **fails closed** (`allowed: false`). Override per check for callers where letting traffic through is preferable to a denial:

```ts
const result = await client.check(evalCtx, "inference", {
    usage: maxTokens,
    eventSubtype: "inference_tokens",
    onAcquireFailure: "fail-open",
});
```

`fail-open` does not skip evaluation: the flag's rules still run with the credit balance assumed sufficient, so plan targeting, overrides, and all non-credit conditions still apply — only the credit gate is bypassed.

### Configuration options

| Option | Type | Default | Description |
|---|---|---|---|
| `defaultLeaseDuration` | `number` | 5 minutes | Lease lifetime in milliseconds |
| `defaultReservationTTL` | `number` | 60 seconds | How long an unsettled reservation is held (ms); set above your longest expected work duration |
| `defaultLeaseSize` | `number` | 10000 | Credits requested per lease acquire/extend |
| `lowWaterMark` | `number` | 0.25 | Extend in the background when the lease balance dips below this fraction |
| `sweepIntervalMs` | `number` | 1000 | Sweep interval for expired reservations (ms) |
| `redisClient` | `RedisClient` | `dataStream.redisClient` | Redis client for lease + reservation state |
| `redisKeyPrefix` | `string` | `dataStream.redisKeyPrefix` | Key prefix for lease + reservation keys |
| `overrides` | `object` | — | Per-credit-type overrides of the above (keyed by credit type ID) |

## Testing

### Offline mode

In development or testing environments, you may want to avoid making network requests to the Schematic API. You can run Schematic in offline mode by specifying the `offline` option; in this case, it does not matter what API key you specify:

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const client = new SchematicClient({ offline: true });

client.close();
```

Offline mode works well with flag defaults:

```ts
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const client = new SchematicClient({
    flagDefaults: { "some-flag-key": true },
    offline: true,
});

// interactions with the client

client.close();
```

## Contributing

While we value open-source contributions to this SDK, this library is generated programmatically.
Additions made directly to this library would have to be moved over to our generation code,
otherwise they would be overwritten upon the next generated release. Feel free to open a PR as
 a proof of concept, but know that we will not be able to merge it as-is. We suggest opening
an issue first to discuss with us!

On the other hand, contributions to the README are always very welcome!
