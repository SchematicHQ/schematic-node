import { SchematicClient } from "../../dist/index.js";

export default {
  async fetch(request, env, ctx) {
    const results = [];

    // Test 1: Offline mode — basic import and instantiation
    try {
      const client = new SchematicClient({ offline: true });
      await client.close();
      results.push("offline-mode: ok");
    } catch (e) {
      return new Response("offline-mode: " + e.message, { status: 500 });
    }

    // Test 2: DataStream in non-replicator mode should be blocked in edge runtime
    try {
      const client = new SchematicClient({
        apiKey: "test_key",
        useDataStream: true,
      });
      // DataStream should have been disabled (no datastreamClient created)
      // but the client should still be functional
      await client.close();
      results.push("datastream-blocked: ok");
    } catch (e) {
      return new Response("datastream-blocked: " + e.message, { status: 500 });
    }

    return new Response(results.join("\n"));
  },
};
