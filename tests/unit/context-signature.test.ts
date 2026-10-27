import * as fs from "fs";
import * as path from "path";
import {
    ContextSignatureError,
    canonicalizeContext,
    DEFAULT_CONTEXT_SIGNATURE_LIFETIME_SECONDS,
    MAX_CONTEXT_SIGNATURE_LIFETIME_SECONDS,
    type SignableContext,
    signContext,
    signContextAt,
} from "../../src/context-signature";

// context-signing.json is copied verbatim from api/lib/contextsig/testdata in
// the Schematic API, which generates it from the verifier and checks it in its
// own tests. Don't edit it here.
interface SigningVectors {
    max_lifetime_seconds: number;
    vectors: {
        canonical: string;
        context: SignableContext;
        exp: number;
        iat: number;
        name: string;
        secret: string;
        signature: string;
    }[];
}

const vectors: SigningVectors = JSON.parse(fs.readFileSync(path.join(__dirname, "context-signing.json"), "utf8"));

function window(signature: string): { iat: number; exp: number } {
    const [iat, exp] = signature.split(".").map(Number);
    return { iat, exp };
}

describe("context signing vectors", () => {
    it("caps the lifetime where the API does", () => {
        expect(MAX_CONTEXT_SIGNATURE_LIFETIME_SECONDS).toBe(vectors.max_lifetime_seconds);
    });

    it.each(vectors.vectors.map((v) => [v.name, v] as const))("%s", (_name, v) => {
        expect(canonicalizeContext(v.context)).toBe(v.canonical);
        expect(signContextAt(v.secret, v.context, v.iat, v.exp)).toBe(v.signature);
    });
});

describe("signContext", () => {
    const context: SignableContext = { company: { id: "comp_1" } };

    it("signs for the default lifetime from now", () => {
        const before = Math.floor(Date.now() / 1000);
        const { iat, exp } = window(signContext("secret", context));

        expect(iat).toBeGreaterThanOrEqual(before);
        expect(iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
        expect(exp - iat).toBe(DEFAULT_CONTEXT_SIGNATURE_LIFETIME_SECONDS);
    });

    it("signs from the time and for the lifetime given", () => {
        const issuedAt = new Date(1_700_000_000_500);
        const signature = signContext("secret", context, { issuedAt, lifetimeSeconds: 300 });

        expect(signature).toBe(signContextAt("secret", context, 1_700_000_000, 1_700_000_300));
    });

    it.each([
        0,
        -60,
        1.5,
        MAX_CONTEXT_SIGNATURE_LIFETIME_SECONDS + 1,
        86_400,
    ])("refuses a lifetime of %p seconds", (lifetimeSeconds) => {
        expect(() => signContext("secret", context, { lifetimeSeconds })).toThrow(ContextSignatureError);
    });

    it("refuses an invalid issuedAt", () => {
        expect(() => signContext("secret", context, { issuedAt: new Date(Number.NaN) })).toThrow(ContextSignatureError);
    });

    it("refuses a missing secret", () => {
        expect(() => signContext("", context)).toThrow(ContextSignatureError);
    });

    it("refuses a value that isn't a string", () => {
        const numeric = { company: { id: 123 } } as unknown as SignableContext;
        expect(() => signContext("secret", numeric)).toThrow(ContextSignatureError);
    });
});

describe("canonicalizeContext", () => {
    it("leaves out a company or user that is null or undefined", () => {
        const context = { company: null, user: undefined } as unknown as SignableContext;
        expect(canonicalizeContext(context)).toBe("{}");
    });

    it("signs a lone surrogate as U+FFFD, as the API reads it", () => {
        expect(canonicalizeContext({ company: { name: "a\ud800b" } })).toBe('{"company":{"name":"a\ufffdb"}}');
        expect(canonicalizeContext({ company: { name: "a\udc00" } })).toBe('{"company":{"name":"a\ufffd"}}');
    });

    it("keeps a valid surrogate pair", () => {
        expect(canonicalizeContext({ company: { name: "\ud83d\ude00" } })).toBe('{"company":{"name":"\ud83d\ude00"}}');
    });
});
