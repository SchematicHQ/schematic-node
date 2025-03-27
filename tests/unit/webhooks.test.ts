import * as crypto from "crypto";
import { IncomingMessage } from "http";
import {
    computeSignature,
    computeHexSignature,
    verifySignature,
    verifyWebhookSignature,
    WebhookSignatureError,
    WEBHOOK_SIGNATURE_HEADER,
    WEBHOOK_TIMESTAMP_HEADER,
} from "../../src/webhooks";

describe("Webhook verification", () => {
    const testPayload = "test webhook payload";
    const testTimestamp = "1679456798";
    const testSecret = "webhook_secret_key";

    describe("computeSignature", () => {
        it("should compute a valid HMAC signature from string payload", () => {
            const signature = computeSignature(testPayload, testTimestamp, testSecret);

            // Manually calculate expected signature
            const signatureContent = Buffer.concat([Buffer.from(testPayload), Buffer.from(`+${testTimestamp}`)]);
            const hmac = crypto.createHmac("sha256", testSecret);
            hmac.update(signatureContent);
            const expectedSignature = hmac.digest();

            expect(Buffer.isBuffer(signature)).toBe(true);
            expect(signature.equals(expectedSignature)).toBe(true);
        });

        it("should compute a valid HMAC signature from buffer payload", () => {
            const payloadBuffer = Buffer.from(testPayload);
            const signature = computeSignature(payloadBuffer, testTimestamp, testSecret);

            // Manually calculate expected signature
            const signatureContent = Buffer.concat([payloadBuffer, Buffer.from(`+${testTimestamp}`)]);
            const hmac = crypto.createHmac("sha256", testSecret);
            hmac.update(signatureContent);
            const expectedSignature = hmac.digest();

            expect(Buffer.isBuffer(signature)).toBe(true);
            expect(signature.equals(expectedSignature)).toBe(true);
        });
    });

    describe("computeHexSignature", () => {
        it("should compute and hex-encode the signature", () => {
            const hexSignature = computeHexSignature(testPayload, testTimestamp, testSecret);
            const bufferSignature = computeSignature(testPayload, testTimestamp, testSecret);

            expect(typeof hexSignature).toBe("string");
            expect(hexSignature).toBe(bufferSignature.toString("hex"));
        });
    });

    describe("verifySignature", () => {
        it("should not throw when signature is valid", () => {
            const validSignature = computeHexSignature(testPayload, testTimestamp, testSecret);

            expect(() => {
                verifySignature(testPayload, validSignature, testTimestamp, testSecret);
            }).not.toThrow();
        });

        it("should throw WebhookSignatureError when signature is invalid", () => {
            const invalidSignature = "invalidSignature";

            expect(() => {
                verifySignature(testPayload, invalidSignature, testTimestamp, testSecret);
            }).toThrow(WebhookSignatureError);
        });

        it("should throw WebhookSignatureError when signature does not match", () => {
            // Generate a valid signature for a different payload
            const differentPayload = "different payload";
            const validButNotMatchingSignature = computeHexSignature(differentPayload, testTimestamp, testSecret);

            expect(() => {
                verifySignature(testPayload, validButNotMatchingSignature, testTimestamp, testSecret);
            }).toThrow(WebhookSignatureError);
            expect(() => {
                verifySignature(testPayload, validButNotMatchingSignature, testTimestamp, testSecret);
            }).toThrow("Invalid webhook signature");
        });

        it("should throw WebhookSignatureError when signature is missing", () => {
            expect(() => {
                verifySignature(testPayload, "", testTimestamp, testSecret);
            }).toThrow(WebhookSignatureError);
            expect(() => {
                verifySignature(testPayload, "", testTimestamp, testSecret);
            }).toThrow("Missing webhook signature header");
        });

        it("should throw WebhookSignatureError when timestamp is missing", () => {
            const validSignature = computeHexSignature(testPayload, testTimestamp, testSecret);

            expect(() => {
                verifySignature(testPayload, validSignature, "", testSecret);
            }).toThrow(WebhookSignatureError);
            expect(() => {
                verifySignature(testPayload, validSignature, "", testSecret);
            }).toThrow("Missing webhook timestamp header");
        });
    });

    describe("verifyWebhookSignature", () => {
        // Mock request object
        const mockRequest = (signature: string, timestamp: string): IncomingMessage => {
            return {
                headers: {
                    [WEBHOOK_SIGNATURE_HEADER]: signature,
                    [WEBHOOK_TIMESTAMP_HEADER]: timestamp,
                },
            } as unknown as IncomingMessage;
        };

        it("should not throw when signature is valid", () => {
            const validSignature = computeHexSignature(testPayload, testTimestamp, testSecret);
            const req = mockRequest(validSignature, testTimestamp);

            expect(() => {
                verifyWebhookSignature(req, testSecret, testPayload);
            }).not.toThrow();
        });

        it("should throw WebhookSignatureError when signature is invalid", () => {
            const invalidSignature = "invalidSignature";
            const req = mockRequest(invalidSignature, testTimestamp);

            expect(() => {
                verifyWebhookSignature(req, testSecret, testPayload);
            }).toThrow(WebhookSignatureError);
        });

        it("should throw WebhookSignatureError when an incorrect secret is used", () => {
            const wrongSecret = "wrong_secret";
            const validSignature = computeHexSignature(testPayload, testTimestamp, testSecret);
            const req = mockRequest(validSignature, testTimestamp);

            expect(() => {
                verifyWebhookSignature(req, wrongSecret, testPayload);
            }).toThrow(WebhookSignatureError);
            expect(() => {
                verifyWebhookSignature(req, wrongSecret, testPayload);
            }).toThrow("Invalid webhook signature");
        });

        it("should work with custom header names", () => {
            const validSignature = computeHexSignature(testPayload, testTimestamp, testSecret);
            const customSignatureHeader = "X-Custom-Signature";
            const customTimestampHeader = "X-Custom-Timestamp";

            const req = {
                headers: {
                    [customSignatureHeader]: validSignature,
                    [customTimestampHeader]: testTimestamp,
                },
            } as unknown as IncomingMessage;

            expect(() => {
                verifyWebhookSignature(req, testSecret, testPayload, {
                    signatureHeader: customSignatureHeader,
                    timestampHeader: customTimestampHeader,
                });
            }).not.toThrow();
        });

        it("should use rawBody from request if body parameter is not provided", () => {
            const validSignature = computeHexSignature(testPayload, testTimestamp, testSecret);
            const req = {
                headers: {
                    [WEBHOOK_SIGNATURE_HEADER]: validSignature,
                    [WEBHOOK_TIMESTAMP_HEADER]: testTimestamp,
                },
                rawBody: testPayload,
            };

            expect(() => {
                verifyWebhookSignature(req, testSecret);
            }).not.toThrow();
        });

        it("should throw when neither body parameter nor rawBody is provided", () => {
            const validSignature = computeHexSignature(testPayload, testTimestamp, testSecret);
            const req = {
                headers: {
                    [WEBHOOK_SIGNATURE_HEADER]: validSignature,
                    [WEBHOOK_TIMESTAMP_HEADER]: testTimestamp,
                },
            };

            expect(() => {
                verifyWebhookSignature(req, testSecret);
            }).toThrow(WebhookSignatureError);
            expect(() => {
                verifyWebhookSignature(req, testSecret);
            }).toThrow("Request body is not available");
        });

        it("should handle header values case-insensitively", () => {
            const validSignature = computeHexSignature(testPayload, testTimestamp, testSecret);
            const req = {
                headers: {
                    [WEBHOOK_SIGNATURE_HEADER.toLowerCase()]: validSignature,
                    [WEBHOOK_TIMESTAMP_HEADER.toLowerCase()]: testTimestamp,
                },
            };

            expect(() => {
                verifyWebhookSignature(req, testSecret, testPayload);
            }).not.toThrow();
        });

        it("should handle array header values", () => {
            const validSignature = computeHexSignature(testPayload, testTimestamp, testSecret);
            const req = {
                headers: {
                    [WEBHOOK_SIGNATURE_HEADER]: [validSignature],
                    [WEBHOOK_TIMESTAMP_HEADER]: [testTimestamp],
                },
            };

            expect(() => {
                verifyWebhookSignature(req, testSecret, testPayload);
            }).not.toThrow();
        });
    });

    describe("WebhookSignatureError", () => {
        it("should create an error with the correct name", () => {
            const error = new WebhookSignatureError("Test error");
            expect(error.name).toBe("WebhookSignatureError");
            expect(error.message).toBe("Test error");
        });

        it("should provide helper methods for common errors", () => {
            const missingSignature = WebhookSignatureError.missingSignature();
            expect(missingSignature).toBeInstanceOf(WebhookSignatureError);
            expect(missingSignature.message).toBe("Missing webhook signature header");

            const missingTimestamp = WebhookSignatureError.missingTimestamp();
            expect(missingTimestamp).toBeInstanceOf(WebhookSignatureError);
            expect(missingTimestamp.message).toBe("Missing webhook timestamp header");

            const invalidSignature = WebhookSignatureError.invalidSignature();
            expect(invalidSignature).toBeInstanceOf(WebhookSignatureError);
            expect(invalidSignature.message).toBe("Invalid webhook signature");
        });
    });
});
