import http from "node:http";
import type { AddressInfo } from "node:net";
import { SchematicClient } from "../../src/wrapper";

const whoAmIBody = JSON.stringify({
    data: {
        account_id: "acc_1",
        account_name: "Test",
        actor_type: "api_key",
        environments: [],
        onboarding_complete: true,
    },
    params: {},
});

const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };

describe("SchematicClient isReady over HTTP", () => {
    let server: http.Server;
    let basePath: string;
    let handler: (req: http.IncomingMessage, res: http.ServerResponse) => void;
    let requests: string[];

    beforeEach(async () => {
        requests = [];
        server = http.createServer((req, res) => {
            requests.push(`${req.method} ${req.url} ${req.headers["x-schematic-api-key"]}`);
            handler(req, res);
        });
        await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
        basePath = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterEach(async () => {
        server.closeAllConnections();
        await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it("resolves true when whoami returns 200", async () => {
        handler = (_req, res) => {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(whoAmIBody);
        };
        const client = new SchematicClient({ apiKey: "sch_test", basePath, logger });

        await expect(client.isReady()).resolves.toBe(true);
        expect(requests).toEqual(["GET /whoami sch_test"]);

        await client.close();
    });

    it("resolves false when whoami rejects the API key", async () => {
        handler = (_req, res) => {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unauthorized" }));
        };
        const client = new SchematicClient({ apiKey: "sch_bad", basePath, logger });

        await expect(client.isReady()).resolves.toBe(false);

        await client.close();
    });

    it("resolves false without retrying when whoami returns 5xx", async () => {
        handler = (_req, res) => {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Unavailable" }));
        };
        const client = new SchematicClient({ apiKey: "sch_test", basePath, logger });

        await expect(client.isReady()).resolves.toBe(false);
        expect(requests).toHaveLength(1);

        await client.close();
    });

    it("resolves false after 5 seconds when whoami hangs, ignoring a longer client timeout", async () => {
        handler = () => {};
        const client = new SchematicClient({ apiKey: "sch_test", basePath, logger, timeoutMs: 60000 });

        const start = Date.now();
        await expect(client.isReady()).resolves.toBe(false);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(4500);
        expect(elapsed).toBeLessThan(8000);
        expect(requests).toHaveLength(1);

        await client.close();
    }, 15000);

    it("resolves false when the API is unreachable", async () => {
        server.closeAllConnections();
        await new Promise<void>((resolve) => server.close(() => resolve()));
        server = http.createServer();
        const client = new SchematicClient({ apiKey: "sch_test", basePath, logger, timeoutMs: 1000 });

        await expect(client.isReady()).resolves.toBe(false);

        await client.close();
    });
});
