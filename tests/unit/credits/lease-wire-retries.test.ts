import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

import { SchematicClient as BaseClient } from "../../../src/Client";
import { CreditLeaseManager } from "../../../src/credits/lease-manager";
import { LeaseStore } from "../../../src/credits/lease-store";
import type { Logger } from "../../../src/logger";
import { randomBaseUrl } from "../../mock-server/randomBaseUrl";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeLogger(): Logger {
    return {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
}

function makeManager() {
    const baseUrl = randomBaseUrl();
    const client = new BaseClient({ apiKey: "test", environment: baseUrl });
    const store = new LeaseStore();
    const manager = new CreditLeaseManager({
        creditsClient: client.credits,
        leaseStore: store,
        logger: makeLogger(),
        config: {
            defaultLeaseDuration: 5 * 60_000,
            defaultReservationTTL: 60_000,
            defaultLeaseSize: 1000,
            lowWaterMark: 0.25,
        },
    });
    return { baseUrl, manager, store };
}

function leaseBody(overrides: { id: string; granted: number; expiresAt: Date }) {
    return {
        data: {
            id: overrides.id,
            company_id: "co_1",
            credit_type_id: "ct_1",
            granted_amount: overrides.granted,
            tracked_amount: 0,
            expires_at: overrides.expiresAt.toISOString(),
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
        },
        params: {},
    };
}

/** Install a live lease locally so `maybeExtendInBackground` has something to extend. */
async function seedLease(store: LeaseStore, granted: number) {
    await store.replace({
        leaseId: "lse_1",
        companyId: "co_1",
        creditTypeId: "ct_1",
        grantedAmount: granted,
        expiresAt: new Date(Date.now() + 5 * 60_000),
    });
}

describe("lease wire retries", () => {
    it("extend sends an idempotency key, and two extends send different keys", async () => {
        const { baseUrl, manager, store } = makeManager();
        await seedLease(store, 1000);
        const keys: (string | undefined)[] = [];
        server.use(
            http.put(`${baseUrl}/billing/credits/lease/lse_1/extend`, async ({ request }) => {
                const body = (await request.json()) as { idempotency_key?: string };
                keys.push(body.idempotency_key);
                return HttpResponse.json(
                    leaseBody({
                        id: "lse_1",
                        granted: 1000 * (keys.length + 1),
                        expiresAt: new Date(Date.now() + 5 * 60_000),
                    }),
                );
            }),
        );

        await manager.maybeExtendInBackground("co_1", "ct_1", 1500);
        await manager.maybeExtendInBackground("co_1", "ct_1", 2500);

        expect(keys).toHaveLength(2);
        expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
        expect(keys[1]).toMatch(/^[0-9a-f-]{36}$/);
        expect(keys[0]).not.toBe(keys[1]);
    });

    it("extend retried after a 502 resends the same key and applies the response once", async () => {
        const { baseUrl, manager, store } = makeManager();
        await seedLease(store, 1000);
        const keys: (string | undefined)[] = [];
        server.use(
            http.put(`${baseUrl}/billing/credits/lease/lse_1/extend`, async ({ request }) => {
                const body = (await request.json()) as { idempotency_key?: string };
                keys.push(body.idempotency_key);
                if (keys.length === 1) {
                    return HttpResponse.json({ error: "bad gateway" }, { status: 502 });
                }
                return HttpResponse.json(
                    leaseBody({ id: "lse_1", granted: 2000, expiresAt: new Date(Date.now() + 5 * 60_000) }),
                );
            }),
        );

        const entry = await manager.maybeExtendInBackground("co_1", "ct_1", 1500);

        expect(keys).toHaveLength(2);
        expect(keys[0]).toBe(keys[1]);
        expect(entry?.grantedAmount).toBe(2000);
        expect(entry?.localRemainingCredits).toBe(2000);
        expect(store.get("co_1", "ct_1")?.grantedAmount).toBe(2000);
    }, 10_000);

    it("acquire retried after a 502 returns the lease from the 200", async () => {
        const { baseUrl, manager } = makeManager();
        let attempts = 0;
        server.use(
            http.post(`${baseUrl}/billing/credits/lease`, () => {
                attempts += 1;
                if (attempts === 1) {
                    return HttpResponse.json({ error: "bad gateway" }, { status: 502 });
                }
                return HttpResponse.json(
                    leaseBody({ id: "lse_1", granted: 1000, expiresAt: new Date(Date.now() + 5 * 60_000) }),
                );
            }),
        );

        const entry = await manager.acquireIfNeeded("co_1", "ct_1");

        expect(attempts).toBe(2);
        expect(entry?.leaseId).toBe("lse_1");
        expect(entry?.localRemainingCredits).toBe(1000);
    }, 10_000);
});
