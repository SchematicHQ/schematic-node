/**
 * SDK E2E Test App for schematic-node.
 *
 * A lightweight HTTP server implementing the standard test app contract
 * defined in the SDK spec. The E2E harness (SchematicHQ/actions/sdk-e2e)
 * calls POST /configure after startup to pass an env-scoped API key,
 * then runs assertions against the other endpoints.
 *
 * SDK source is controlled by SDK_SOURCE env var:
 *   - "local" (default): imports from ../dist (requires yarn build)
 *   - "published": imports from @schematichq/schematic-typescript-node (npm install first)
 *   - "pack": same import as published, but installed from npm pack tarball
 *
 * Usage:
 *   # Local build (default)
 *   yarn build && node testapp/index.js
 *
 *   # Published version
 *   cd testapp && npm install @schematichq/schematic-typescript-node@1.4.4
 *   SDK_SOURCE=published node testapp/index.js
 *
 *   # Pack (pre-release smoke test)
 *   yarn build && npm pack
 *   cd testapp && npm install ../schematichq-schematic-typescript-node-*.tgz
 *   SDK_SOURCE=pack node testapp/index.js
 */

const http = require("http");

const SDK_SOURCE = process.env.SDK_SOURCE || "local";
const sdk =
  SDK_SOURCE === "local"
    ? require("../dist")
    : require("@schematichq/schematic-typescript-node");
const { SchematicClient, LocalCache, RedisCacheProvider } = sdk;

const PORT = parseInt(process.env.PORT || "8080", 10);
const CACHE_TTL_MS = 2000; // Short TTL for E2E — tests sleep past this to verify cache expiration

// --- State ---

let client = null;
let currentConfig = {};

// --- Helpers ---

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function parseJSON(req) {
  const raw = await readBody(req);
  if (!raw) return {};
  return JSON.parse(raw);
}

function jsonResponse(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

// --- Route handlers ---

async function handleConfigure(req, res) {
  const body = await parseJSON(req);

  // Close existing client if any
  if (client) {
    try {
      await client.close();
    } catch (_) {
      // ignore
    }
  }

  // Build the cache provider
  let cacheProvider;
  if (body.redisUrl) {
    const redis = require("redis");
    const redisClient = redis.createClient({ url: body.redisUrl });
    await redisClient.connect();
    cacheProvider = new RedisCacheProvider({ client: redisClient, ttl: CACHE_TTL_MS });
  } else {
    cacheProvider = new LocalCache({ maxItems: 1000, ttl: CACHE_TTL_MS });
  }

  const opts = {
    apiKey: body.apiKey,
    cacheProviders: { flagChecks: [cacheProvider] },
  };

  if (body.baseUrl) {
    opts.basePath = body.baseUrl;
  }
  if (body.flagDefaults) {
    opts.flagDefaults = body.flagDefaults;
  }
  if (body.offline) {
    opts.offline = true;
  }
  if (body.useDataStream) {
    opts.useDataStream = true;
  }

  client = new SchematicClient(opts);
  currentConfig = body;

  jsonResponse(res, 200, { success: true, cacheTtlMs: CACHE_TTL_MS });
}

function handleHealth(_req, res) {
  jsonResponse(res, 200, {
    status: client ? "configured" : "waiting",
    config: {
      offline: currentConfig.offline || false,
      useDataStream: currentConfig.useDataStream || false,
      hasFlagDefaults: !!(
        currentConfig.flagDefaults &&
        Object.keys(currentConfig.flagDefaults).length > 0
      ),
      cacheTtlMs: CACHE_TTL_MS,
    },
  });
}

async function handleCheckFlag(req, res) {
  if (!client) {
    jsonResponse(res, 503, { error: "not configured" });
    return;
  }

  const body = await parseJSON(req);
  const evalCtx = {};
  if (body.company) evalCtx.company = body.company;
  if (body.user) evalCtx.user = body.user;

  try {
    const value = await client.checkFlag(evalCtx, body.flagKey);
    jsonResponse(res, 200, { value });
  } catch (err) {
    jsonResponse(res, 200, { value: false, error: err.message });
  }
}

async function handleIdentify(req, res) {
  if (!client) {
    jsonResponse(res, 503, { error: "not configured" });
    return;
  }

  const body = await parseJSON(req);

  // Translate E2E contract to Node SDK's EventBodyIdentify:
  //   E2E:  { company: {k:v}, user: {k:v}, keys: {k:v} }
  //   SDK:  { keys: {k:v}, company?: { keys: {k:v} } }
  const identifyBody = {
    keys: body.keys || body.user || {},
  };
  if (body.company) {
    identifyBody.company = { keys: body.company };
  }

  try {
    await client.identify(identifyBody);
    jsonResponse(res, 200, { success: true });
  } catch (err) {
    jsonResponse(res, 200, { success: false, error: err.message });
  }
}

async function handleTrack(req, res) {
  if (!client) {
    jsonResponse(res, 503, { error: "not configured" });
    return;
  }

  const body = await parseJSON(req);

  const trackBody = {
    event: body.event,
  };
  if (body.company) trackBody.company = body.company;
  if (body.user) trackBody.user = body.user;
  if (body.traits) trackBody.traits = body.traits;
  if (body.quantity !== undefined) trackBody.quantity = body.quantity;

  try {
    await client.track(trackBody);
    jsonResponse(res, 200, { success: true });
  } catch (err) {
    jsonResponse(res, 200, { success: false, error: err.message });
  }
}

async function handleSetFlagDefault(req, res) {
  if (!client) {
    jsonResponse(res, 503, { error: "not configured" });
    return;
  }

  const body = await parseJSON(req);
  try {
    client.setFlagDefault(body.flagKey, body.value);
    jsonResponse(res, 200, { success: true });
  } catch (err) {
    jsonResponse(res, 200, { success: false, error: err.message });
  }
}

// --- Server ---

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;
  const path = url.pathname;

  try {
    if (method === "GET" && path === "/health") {
      return handleHealth(req, res);
    }
    if (method === "POST" && path === "/configure") {
      return await handleConfigure(req, res);
    }
    if (method === "POST" && path === "/check-flag") {
      return await handleCheckFlag(req, res);
    }
    if (method === "POST" && path === "/identify") {
      return await handleIdentify(req, res);
    }
    if (method === "POST" && path === "/track") {
      return await handleTrack(req, res);
    }
    if (method === "POST" && path === "/set-flag-default") {
      return await handleSetFlagDefault(req, res);
    }

    jsonResponse(res, 404, { error: "not found" });
  } catch (err) {
    console.error(`Error handling ${method} ${path}:`, err);
    jsonResponse(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`SDK E2E test app listening on http://localhost:${PORT}`);
  console.log("Waiting for POST /configure to initialize SchematicClient...");
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  if (client) await client.close();
  server.close();
});
process.on("SIGINT", async () => {
  if (client) await client.close();
  server.close();
});
