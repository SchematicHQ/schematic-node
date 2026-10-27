/**
 * Signs the context a browser SDK sends with a publishable key, for
 * environments that require context signatures.
 *
 * A publishable key is public, so the API can't trust the company and user a
 * browser names with it. When the environment requires signatures, your
 * backend, which holds the secret API key, signs the logged-in user's own
 * company and user, and the browser SDK sends that signature in the
 * X-Schematic-Context-Sig header. Sign the context from your own authenticated
 * session, never from what the browser asks for.
 *
 * The signature is `iat.exp.sig`, where `sig` is the unpadded base64url
 * HMAC-SHA256 of `canonical(context).iat.exp` keyed with the secret API key,
 * and `canonical` is the context's JSON with keys sorted by code point and no
 * whitespace.
 */

import * as crypto from "crypto";

/**
 * Request header the browser SDK sends the signature in.
 */
export const CONTEXT_SIGNATURE_HEADER = "X-Schematic-Context-Sig";

/**
 * How long a signature is valid for unless `lifetimeSeconds` says otherwise.
 * It matches how long the browser SDK reuses one.
 */
export const DEFAULT_CONTEXT_SIGNATURE_LIFETIME_SECONDS = 600;

/**
 * The longest the API accepts a signature as valid for.
 */
export const MAX_CONTEXT_SIGNATURE_LIFETIME_SECONDS = 3600;

/**
 * The company and user a browser SDK checks flags and sends events for, by
 * their keys. Leave one out when it's absent; an empty object is signed as
 * empty. It must match the context the browser SDK is given exactly.
 */
export interface SignableContext {
    company?: Record<string, string>;
    user?: Record<string, string>;
}

export interface SignContextOptions {
    /**
     * When the signature is valid from; now by default. Counted in whole
     * seconds.
     */
    issuedAt?: Date;
    /**
     * How long the signature is valid for, in whole seconds, from 1 up to
     * MAX_CONTEXT_SIGNATURE_LIFETIME_SECONDS.
     */
    lifetimeSeconds?: number;
}

/**
 * Error thrown when a context can't be signed.
 */
export class ContextSignatureError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ContextSignatureError.prototype);
        this.name = "ContextSignatureError";
    }
}

/**
 * Returns the X-Schematic-Context-Sig value for a context.
 * @param secret - The secret API key for the environment the browser SDK's publishable key belongs to.
 * @param context - The logged-in user's company and user keys.
 * @param options - When the signature is valid from, and for how long.
 * @throws {ContextSignatureError} If the secret is missing, the lifetime is out of range, or a key's value isn't a string.
 */
export function signContext(secret: string, context: SignableContext, options: SignContextOptions = {}): string {
    if (!secret) {
        throw new ContextSignatureError("A secret API key is required to sign a context.");
    }

    const lifetime = options.lifetimeSeconds ?? DEFAULT_CONTEXT_SIGNATURE_LIFETIME_SECONDS;
    if (!Number.isInteger(lifetime) || lifetime < 1 || lifetime > MAX_CONTEXT_SIGNATURE_LIFETIME_SECONDS) {
        throw new ContextSignatureError(
            `lifetimeSeconds must be a whole number from 1 to ${MAX_CONTEXT_SIGNATURE_LIFETIME_SECONDS}.`,
        );
    }

    const issuedAt = options.issuedAt ?? new Date();
    const iat = Math.floor(issuedAt.getTime() / 1000);
    if (!Number.isFinite(iat)) {
        throw new ContextSignatureError("issuedAt must be a valid date.");
    }

    return signContextAt(secret, context, iat, iat + lifetime);
}

/**
 * Signs a context for an explicit `iat` and `exp`, in unix seconds. Exported
 * for tests; use signContext.
 * @internal
 */
export function signContextAt(secret: string, context: SignableContext, iat: number, exp: number): string {
    const payload = `${canonicalizeContext(context)}.${iat}.${exp}`;
    const sig = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("base64url");
    return `${iat}.${exp}.${sig}`;
}

/**
 * Encodes a context the way the API does before verifying it: keys sorted by
 * code point, no whitespace, `<`, `>`, `&` and `/` left literal, and U+2028 and
 * U+2029 escaped.
 * @internal
 */
export function canonicalizeContext(context: SignableContext): string {
    const parts: string[] = [];
    // "company" sorts before "user".
    if (context.company != null) {
        parts.push(`"company":${canonicalizeKeys(context.company)}`);
    }
    if (context.user != null) {
        parts.push(`"user":${canonicalizeKeys(context.user)}`);
    }
    return `{${parts.join(",")}}`;
}

function canonicalizeKeys(keys: Record<string, string>): string {
    const names = Object.keys(keys).sort(compareCodePoints);
    const entries = names.map((name) => {
        const value = keys[name];
        if (typeof value !== "string") {
            throw new ContextSignatureError(`The value of context key "${name}" must be a string.`);
        }
        return `${encodeString(name)}:${encodeString(value)}`;
    });
    return `{${entries.join(",")}}`;
}

// The API sorts keys by their UTF-8 bytes, which is code point order. The
// default sort compares UTF-16 code units, which puts a character outside the
// BMP (a surrogate pair) before U+E000 to U+FFFF.
function compareCodePoints(a: string, b: string): number {
    return Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

const loneSurrogate = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;

// JSON.stringify escapes quotes, backslashes and control characters the way
// the API does. Two differences remain: the API escapes U+2028 and U+2029,
// and it reads a lone surrogate as U+FFFD.
function encodeString(value: string): string {
    return JSON.stringify(value.replace(loneSurrogate, "\ufffd"))
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}
