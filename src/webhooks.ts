/**
 * Webhook verification utilities for verifying webhooks from Schematic.
 */

import * as crypto from "crypto";
import { IncomingMessage } from "http";

/**
 * HTTP header containing the webhook signature.
 */
export const WEBHOOK_SIGNATURE_HEADER = "X-Schematic-Webhook-Signature";

/**
 * HTTP header containing the webhook timestamp.
 */
export const WEBHOOK_TIMESTAMP_HEADER = "X-Schematic-Webhook-Timestamp";

/**
 * Error class for invalid webhook signatures.
 */
export class WebhookSignatureError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, WebhookSignatureError.prototype);
        this.name = "WebhookSignatureError";
    }

    static missingSignature(): WebhookSignatureError {
        return new WebhookSignatureError("Missing webhook signature header");
    }

    static missingTimestamp(): WebhookSignatureError {
        return new WebhookSignatureError("Missing webhook timestamp header");
    }

    static invalidSignature(): WebhookSignatureError {
        return new WebhookSignatureError("Invalid webhook signature");
    }
}

/**
 * Computes the HMAC-SHA256 signature for a webhook payload.
 * @param body - The request body.
 * @param timestamp - The timestamp from the webhook request.
 * @param secret - The webhook secret.
 * @returns The computed signature as a Buffer.
 */
export function computeSignature(body: Buffer | string, timestamp: string, secret: string): Buffer {
    const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
    // Compute signature: HMAC(body + "+" + timestamp, secret)
    const signatureContent = Buffer.concat([bodyBuffer, Buffer.from(`+${timestamp}`)]);
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(signatureContent);
    return hmac.digest();
}

/**
 * Computes and hex-encodes the HMAC-SHA256 signature for a webhook payload.
 * @param body - The request body.
 * @param timestamp - The timestamp from the webhook request.
 * @param secret - The webhook secret.
 * @returns The computed signature as a hex-encoded string.
 */
export function computeHexSignature(body: Buffer | string, timestamp: string, secret: string): string {
    return computeSignature(body, timestamp, secret).toString("hex");
}

/**
 * Verifies a webhook signature against the payload and timestamp.
 * @param payload - The request body.
 * @param signature - The signature from the webhook request.
 * @param timestamp - The timestamp from the webhook request.
 * @param secret - The webhook secret.
 * @throws {WebhookSignatureError} If the signature is invalid or headers are missing.
 */
export function verifySignature(payload: Buffer | string, signature: string, timestamp: string, secret: string): void {
    if (!signature) {
        throw WebhookSignatureError.missingSignature();
    }

    if (!timestamp) {
        throw WebhookSignatureError.missingTimestamp();
    }

    // Decode signature
    let decodedSignature: Buffer;
    try {
        decodedSignature = Buffer.from(signature, "hex");
    } catch (err: any) {
        throw new WebhookSignatureError(`Invalid signature format: ${err?.message || "Unknown error"}`);
    }

    // Compute expected signature
    const expectedSignature = computeSignature(payload, timestamp, secret);

    // Compare signatures using constant-time comparison
    // First check lengths to avoid RangeError from timingSafeEqual
    if (decodedSignature.length !== expectedSignature.length) {
        throw WebhookSignatureError.invalidSignature();
    }

    if (!crypto.timingSafeEqual(decodedSignature, expectedSignature)) {
        throw WebhookSignatureError.invalidSignature();
    }
}

/**
 * Options for webhook verification.
 */
interface VerifyWebhookSignatureOptions {
    /**
     * Custom signature header name. Defaults to 'X-Schematic-Webhook-Signature'.
     */
    signatureHeader?: string;

    /**
     * Custom timestamp header name. Defaults to 'X-Schematic-Webhook-Timestamp'.
     */
    timestampHeader?: string;
}

/**
 * Represents a request object with headers and optional raw body.
 */
export type WebhookRequest = IncomingMessage | { headers: Record<string, string | string[] | undefined>; rawBody?: Buffer | string };

/**
 * Verifies the signature of a webhook request.
 * @param req - The request object.
 * @param secret - The webhook secret.
 * @param body - The raw request body. Required when using frameworks that parse the body beforehand.
 * @param options - Optional configuration for header names.
 * @throws {WebhookSignatureError} If the signature is invalid or headers are missing.
 */
export function verifyWebhookSignature(
    req: WebhookRequest,
    secret: string,
    body?: Buffer | string,
    options: VerifyWebhookSignatureOptions = {}
): void {
    // Get headers
    const headers = req.headers;
    const signatureHeaderName = options.signatureHeader || WEBHOOK_SIGNATURE_HEADER;
    const timestampHeaderName = options.timestampHeader || WEBHOOK_TIMESTAMP_HEADER;

    const signature = getHeader(headers, signatureHeaderName);
    const timestamp = getHeader(headers, timestampHeaderName);

    // Use provided body or check for rawBody on request
    let payload: Buffer | string;
    if (body !== undefined) {
        payload = body;
    } else if ("rawBody" in req && req.rawBody) {
        payload = req.rawBody;
    } else {
        throw new WebhookSignatureError(
            "Request body is not available. Provide the body as a parameter or ensure req.rawBody exists."
        );
    }

    // Verify the signature
    verifySignature(payload, signature, timestamp, secret);
}

/**
 * Helper function to get a header value as a string.
 */
function getHeader(headers: Record<string, string | string[] | undefined>, headerName: string): string {
    const headerValue = headers[headerName] || headers[headerName.toLowerCase()];
    if (Array.isArray(headerValue)) {
        return headerValue[0] || "";
    }
    return headerValue || "";
}
