# schematic-typescript-node

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
import { LocalCache, SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;
const cacheSize = 100;
const cacheTTL = 1000; // in milliseconds
const client = new SchematicClient({
    apiKey,
    cacheProviders: {
        flagChecks: [new LocalCache<boolean>({ maxItems: cacheSize, ttl: cacheTTL })],
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

If no logger is provided, the client will use a default console logger that outputs to the standard console methods.

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
