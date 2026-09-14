#!/usr/bin/env bash
#
# Builds the real npm tarball from the working tree and installs it into
# testapp/, the way a consumer installing from the registry would.
#
# SDK_SOURCE=local requires ../dist directly, so it never exercises packaging:
# the `files` allowlist in package.json, prepack, or whether the rules engine
# actually ends up inside the published artifact. This script closes that gap,
# so a broken package fails pre-merge instead of after `npm publish`.
#
# Prerequisites (this script does NOT run them):
#   yarn install --frozen-lockfile
#   ./scripts/download-wasm.sh
#   yarn build
#
# Usage, from the repo root:
#   ./scripts/e2e-pack.sh
#   SDK_SOURCE=pack node testapp/index.js
#
set -euo pipefail

# pwd -P resolves symlinks so REPO_ROOT matches the real path require.resolve
# returns below.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
cd "$REPO_ROOT"

ARTIFACT_DIR="artifacts"

fail() {
    echo "ERROR: $*" >&2
    exit 1
}

# --- 1. Preconditions -------------------------------------------------------

[ -f dist/index.js ] || fail "dist/index.js not found. Run: ./scripts/download-wasm.sh && yarn build"
[ -d node_modules ] || fail "node_modules not found. Run: yarn install --frozen-lockfile"

# --- 2. Pack ----------------------------------------------------------------

rm -rf "$ARTIFACT_DIR"
mkdir -p "$ARTIFACT_DIR"

echo "Packing $(node -p "require('./package.json').name")@$(node -p "require('./package.json').version")..."

# --json gives us the exact filename npm chose. Globbing for it instead would
# silently pick the wrong file the moment a stale tarball is lying around.
# shellcheck disable=SC2016  # the single-quoted block is JS source, not shell
TARBALL_NAME="$(npm pack --pack-destination "$ARTIFACT_DIR" --json | node -e '
let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("could not parse `npm pack --json` output:\n" + raw);
    process.exit(1);
  }
  if (!Array.isArray(parsed) || parsed.length !== 1 || !parsed[0].filename) {
    console.error("expected exactly one tarball from `npm pack`, got:\n" + raw);
    process.exit(1);
  }
  process.stdout.write(parsed[0].filename);
});
')"

TARBALL="$ARTIFACT_DIR/$TARBALL_NAME"
[ -f "$TARBALL" ] || fail "npm pack reported $TARBALL_NAME but $TARBALL does not exist"

echo "Packed $TARBALL ($(du -h "$TARBALL" | cut -f1))"

# --- 3. Verify the rules engine is inside the tarball ------------------------

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

tar xzf "$TARBALL" -C "$TMP" package/dist
[ -d "$TMP/package/dist" ] || fail "no package/dist/ in $TARBALL"

# build.js inlines the rules engine into dist/wasm/rulesengine.js as base64 and
# then deletes the standalone dist/wasm/rulesengine_bg.wasm, so a bare "is there
# a .wasm in the tarball" check would fail on a perfectly good package. Accept
# either shape, but decode the bytes in both cases and confirm they really are a
# WebAssembly module rather than trusting a filename.
cat > "$TMP/verify-wasm.js" <<'VERIFY_EOF'
const fs = require("fs");
const path = require("path");

const distDir = path.join(process.argv[2], "package", "dist");
const tarball = process.argv[3];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

// WebAssembly binaries start with the 4-byte magic \0asm.
const isWasm = (buf) =>
  buf.length >= 4 &&
  buf[0] === 0x00 &&
  buf[1] === 0x61 &&
  buf[2] === 0x73 &&
  buf[3] === 0x6d;

const die = (msg) => {
  console.error("ERROR: " + msg);
  console.error("");
  console.error("The rules engine is missing from " + tarball + ".");
  console.error("SDK_SOURCE=local would still pass because it requires ../dist");
  console.error("directly, but anyone installing this package from npm would");
  console.error("get a broken SDK.");
  console.error("");
  console.error("Check the `files` allowlist in package.json, and that");
  console.error("./scripts/download-wasm.sh ran before `yarn build`.");
  process.exit(1);
};

const files = walk(distDir);
const rel = (f) => path.join("package/dist", path.relative(distDir, f));

// Shape A: a standalone .wasm shipped alongside the loader.
const standalone = files.filter((f) => f.endsWith(".wasm"));
if (standalone.length > 0) {
  for (const file of standalone) {
    if (!isWasm(fs.readFileSync(file))) die(rel(file) + " is not a WebAssembly module");
    console.log("OK: " + rel(file) + " (" + fs.statSync(file).size + " bytes, valid wasm magic)");
  }
  process.exit(0);
}

// Shape B: bytes inlined as base64 by build.js inlineWasmBinary().
const loader = path.join(distDir, "wasm", "rulesengine.js");
if (!fs.existsSync(loader)) {
  die("no *.wasm under package/dist/ and no package/dist/wasm/rulesengine.js either");
}

const source = fs.readFileSync(loader, "utf8");
const match = source.match(/Buffer\.from\(\s*["']([A-Za-z0-9+/=]+)["']\s*,\s*["']base64["']\s*\)/);
if (!match) {
  die(
    "package/dist/wasm/rulesengine.js carries no inlined base64 wasm payload, " +
      "and no standalone .wasm was shipped either"
  );
}

const bytes = Buffer.from(match[1], "base64");
if (!isWasm(bytes)) {
  die("the inlined payload in package/dist/wasm/rulesengine.js is not a WebAssembly module");
}

console.log(
  "OK: package/dist/wasm/rulesengine.js carries the rules engine inlined (" +
    bytes.length +
    " bytes, valid wasm magic)"
);
VERIFY_EOF

node "$TMP/verify-wasm.js" "$TMP" "$TARBALL"

# --- 4. Install the tarball into testapp/ ------------------------------------

echo "Installing $TARBALL into testapp/..."
cd testapp
npm install
# --no-save keeps the checked-in testapp/package.json clean. The package is
# still fully installed into testapp/node_modules with its dependency tree.
npm install --no-save "$REPO_ROOT/$TARBALL"

RESOLVED="$(node -e 'console.log(require.resolve("@schematichq/schematic-typescript-node"))')"
echo "require.resolve(\"@schematichq/schematic-typescript-node\") -> $RESOLVED"
case "$RESOLVED" in
    "$REPO_ROOT"/testapp/node_modules/*) ;;
    *) fail "the SDK resolved outside testapp/node_modules: $RESOLVED" ;;
esac

echo ""
echo "Done. Now run: SDK_SOURCE=pack node testapp/index.js"
