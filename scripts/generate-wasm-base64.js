// Generates the base64-encoded WASM module required by the rules engine.
// This runs automatically via the "pretest" script so that tests work
// without a full build (e.g. in CI where Fern runs `yarn test` directly).
const { readFileSync, writeFileSync, existsSync } = require('fs');
const path = require('path');

const wasmPath = path.join(__dirname, '..', 'src', 'wasm', 'rulesengine_bg.wasm');
const outPath = path.join(__dirname, '..', 'src', 'wasm', 'rulesengine_bg_wasm_base64.js');

if (existsSync(outPath)) {
  process.exit(0);
}

const wasmBytes = readFileSync(wasmPath);
const wasmBase64 = wasmBytes.toString('base64');
writeFileSync(outPath, `module.exports = "${wasmBase64}";\n`);
