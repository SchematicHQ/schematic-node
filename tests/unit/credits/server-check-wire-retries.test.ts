import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

import { SchematicClient as BaseClient } from "../../../src/Client";
import { checkWithServerReservation, type ServerCheckDeps } from "../../../src/credits/server-check";
import type { CheckResult } from "../../../src/credits/types";
import type { Logger } from "../../../src/logger";
import { randomBaseUrl } from "../../mock-server/randomBaseUrl";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const TTL_MS = 120_000;

function makeLogger(): Logger {
    return {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}

function makeDeps(): { baseUrl: string; deps: ServerCheckDeps } {
    const baseUrl = randomBaseUrl();
    const client = new BaseClient({ apiKey: "test", environment: baseUrl });
    return {
        baseUrl,
        deps: {
            features: client.features,
            credits: client.credits,
            logger: makeLogger(),
            reservationTTL: TTL_MS,
            getDefault: () => false,
        },
    };
}

function reserveBody() {
    return {
        data: {
            flag: "inference",
            flag_id: "flag_1",
            value: true,
            reason: "matched",
            reservation: {
                id: "rsv_1",
                company_id: "co_1",
                credit_type_id: "bilcr_inference",
                consumption_rate: 10,
                credits_reserved: 500,
                quantity_reserved: 50,
                event_subtype: "inference_tokens",
                expires_at: new Date(Date.now() + TTL_MS).toISOString(),
            },
        },
        params: {},
    };
}

/** The server path never reaches this in these cases; it fails the test if it does. */
function unusedFallback(): Promise<CheckResult> {
    throw new Error("fallback should not run");
}

function runCheck(deps: ServerCheckDeps): Promise<CheckResult> {
    return checkWithServerReservation(
        deps,
        "inference",
        { company: { id: "co_1" } },
        { usage: 50, eventSubtype: "inference_tokens" },
        unusedFallback,
    );
}

describe("server check wire retries", () => {
    it("sends an idempotency key on the request body, and two checks send different keys", async () => {
        const { baseUrl, deps } = makeDeps();
        const keys: (string | undefined)[] = [];
        server.use(
            http.post(`${baseUrl}/flags/inference/check-and-reserve`, async ({ request }) => {
                const body = (await request.json()) as { idempotency_key?: string };
                keys.push(body.idempotency_key);
                return HttpResponse.json(reserveBody());
            }),
        );

        await runCheck(deps);
        await runCheck(deps);

        expect(keys).toHaveLength(2);
        expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
        expect(keys[1]).toMatch(/^[0-9a-f-]{36}$/);
        expect(keys[0]).not.toBe(keys[1]);
    });

    it("resends the same key on a retry after a 502 and returns the reservation", async () => {
        const { baseUrl, deps } = makeDeps();
        const keys: (string | undefined)[] = [];
        server.use(
            http.post(`${baseUrl}/flags/inference/check-and-reserve`, async ({ request }) => {
                const body = (await request.json()) as { idempotency_key?: string };
                keys.push(body.idempotency_key);
                if (keys.length === 1) {
                    return HttpResponse.json({ error: "bad gateway" }, { status: 502 });
                }
                return HttpResponse.json(reserveBody());
            }),
        );

        const result = await runCheck(deps);

        expect(keys).toHaveLength(2);
        expect(keys[0]).toBe(keys[1]);
        expect(result.allowed).toBe(true);
        expect(result.reservation?.id).toBe("rsv_1");
        expect(result.reservation?.mode).toBe("server");
        expect(result.reservation?.creditsReserved).toBe(500);
    }, 10_000);
});
