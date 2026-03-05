import { build } from "esbuild";
import { Miniflare } from "miniflare";

// Bundle the worker entry + all external deps into a single ESM file.
// platform: 'browser' mirrors how Wrangler bundles for Workers (no Node.js globals assumed).
// nodejs_compat in Miniflare provides runtime polyfills for Node built-ins.
const result = await build({
  entryPoints: ["tests/cloudflare/worker.mjs"],
  bundle: true,
  format: "esm",
  target: "esnext",
  platform: "browser",
  write: false,
});

const mf = new Miniflare({
  modules: true,
  script: result.outputFiles[0].text,
  compatibilityFlags: ["nodejs_compat"],
  compatibilityDate: "2024-09-23",
});

try {
  const res = await mf.dispatchFetch("http://localhost/");
  const text = await res.text();
  if (!res.ok) {
    console.error("❌ Cloudflare compatibility test failed:", text);
    process.exit(1);
  }
  console.log("✅ Cloudflare compatibility test passed!");
} finally {
  await mf.dispose();
}
