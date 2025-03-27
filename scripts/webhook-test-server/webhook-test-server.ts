#!/usr/bin/env node

/**
 * Webhook Test Server
 *
 * This is a testing utility to verify Schematic webhook signatures. It exposes
 * a simple HTTP server that logs and validates incoming webhook requests.
 *
 * Usage:
 *
 *  1. Set up:
 *     - Export your webhook secret: export SCHEMATIC_WEBHOOK_SECRET="your-webhook-secret"
 *     - Optionally set a custom port: export PORT=9000 (default: 8080)
 *     - Run: npx ts-node scripts/webhook-test-server/webhook-test-server.ts
 *       or
 *     - Build and run: tsc scripts/webhook-test-server/webhook-test-server.ts && node scripts/webhook-test-server/webhook-test-server.js
 *
 *  2. Expose to the internet:
 *     - Since Schematic can't access localhost directly, use a tunneling service like ngrok:
 *       ngrok http 8080
 *
 *  3. Configure in Schematic:
 *     - Use the ngrok URL (e.g., https://a1b2c3d4.ngrok.io/webhook) as your webhook endpoint
 *     - Set the same webhook secret in Schematic that you used in SCHEMATIC_WEBHOOK_SECRET
 *
 *  4. Test:
 *     - Trigger a webhook from Schematic
 *     - This server will verify the signature and output the payload
 *
 * This tool helps validate the webhook signature verification implementation before
 * integrating it into production applications.
 */

import http from "http";
import { verifyWebhookSignature } from "../../src/webhooks";

const webhookSecret = process.env.SCHEMATIC_WEBHOOK_SECRET;
if (!webhookSecret) {
    console.error("SCHEMATIC_WEBHOOK_SECRET environment variable is required");
    process.exit(1);
}

const server = http.createServer(async (req, res) => {
    if (req.url !== "/webhook" || req.method !== "POST") {
        res.statusCode = 404;
        res.end("Not Found");
        return;
    }

    console.log("Received webhook request");

    const chunks: Buffer[] = [];

    try {
        for await (const chunk of req) {
            chunks.push(Buffer.from(chunk));
        }

        const body = Buffer.concat(chunks);

        try {
            verifyWebhookSignature(req, webhookSecret, body);

            console.log("Signature verification successful");

            console.log("Headers:");
            Object.entries(req.headers).forEach(([name, value]) => {
                console.log(`  ${name}: ${value}`);
            });

            try {
                const jsonData = JSON.parse(body.toString());
                console.log("Webhook payload:");
                console.log(JSON.stringify(jsonData, null, 2));
            } catch (e) {
                console.log("Webhook payload (raw):");
                console.log(body.toString());
            }

            res.statusCode = 200;
            res.end("Webhook received and verified successfully");
        } catch (error: any) {
            console.error("Signature verification failed:", error?.message || error);
            res.statusCode = 401;
            res.end(`Signature verification failed: ${error?.message || "Unknown error"}`);
        }
    } catch (error: any) {
        console.error("Failed to read request body:", error?.message || error);
        res.statusCode = 500;
        res.end("Failed to read request body");
    }
});

const port = process.env.PORT || "8080";
server.listen(parseInt(port), () => {
    console.log(`Starting webhook test server on port ${port}`);
    console.log(`Local URL: http://localhost:${port}/webhook`);
    console.log("Remember: Use a tool like ngrok to expose this server to the internet");
    console.log(`Example: ngrok http ${port}`);
});
