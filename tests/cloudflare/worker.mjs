import { SchematicClient } from "../../dist/index.js";

export default {
  async fetch(request, env, ctx) {
    try {
      const client = new SchematicClient({ offline: true });
      return new Response("OK");
    } catch (e) {
      return new Response("Error: " + e.message, { status: 500 });
    }
  },
};
