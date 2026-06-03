// build.js
const esbuild = require('esbuild');
const { execSync } = require('child_process');
const { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } = require('fs');

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18.19',
  minify: true,
  sourcemap: 'external',
  external: [
    // Keep dependencies external since this is a library
    'form-data',
    'formdata-node',
    'node-fetch',
    'readable-stream',
    // Optional peer dependencies - resolved from consumer's node_modules
    'redis',
    'ws',
    // WASM rules engine — loaded dynamically at runtime in Node.js only
    './wasm/rulesengine.js',
  ],
  tsconfig: './tsconfig.json',
};

async function build() {
  try {
    // Build CommonJS version with esbuild
    await esbuild.build({
      ...sharedConfig,
      outfile: 'dist/index.js',
      format: 'cjs',
    });

    console.log('✅ JavaScript build completed with esbuild');

    // Copy WASM artifacts to dist so they ship with the package
    mkdirSync('dist/wasm', { recursive: true });
    const wasmFiles = [
      'rulesengine_bg.wasm',
      'rulesengine.js',
      'rulesengine.d.ts',
      'rulesengine_bg.wasm.d.ts',
    ];
    for (const file of wasmFiles) {
      const src = `src/wasm/${file}`;
      if (existsSync(src)) {
        cpSync(src, `dist/wasm/${file}`);
      }
    }
    console.log('✅ WASM artifacts copied to dist/wasm/');

    inlineWasmBinary();

    // Generate TypeScript declarations with tsc
    console.log('🔧 Generating TypeScript declarations...');
    execSync('tsc --emitDeclarationOnly --outDir dist', { stdio: 'inherit' });

    console.log('✅ TypeScript declarations generated');
    console.log('🎉 Build completed successfully!');

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Inline the WASM binary into dist/wasm/rulesengine.js so the runtime no
// longer reads it off disk via `fs.readFileSync(${__dirname}/...)`.
//
// The wasm-bindgen-generated loader resolves the .wasm file relative to
// its own `__dirname`, which breaks the moment a downstream bundler
// (webpack, Next.js, Vite, etc.) follows the require chain and rewrites
// `__dirname` to point inside the bundle output — there's no `.wasm`
// sibling there, so initialization fails with a misleading ENOENT.
// See the linked Next.js failure mode at
//   .next/dev/server/vendor-chunks/rulesengine_bg.wasm  →  ENOENT.
//
// Inlining the bytes as a base64 string sidesteps the whole class of
// `__dirname`-aware loaders. Costs ~+138 KB on the tarball (550 KB
// base64 string in JS replaces a 414 KB .wasm + the loader stub) but
// makes the SDK bundler-agnostic for free. We delete the standalone
// `.wasm` after rewriting since nothing reads it at runtime anymore.
function inlineWasmBinary() {
  const loaderPath = 'dist/wasm/rulesengine.js';
  const binaryPath = 'dist/wasm/rulesengine_bg.wasm';
  if (!existsSync(loaderPath) || !existsSync(binaryPath)) {
    console.warn('⚠️  Skipping WASM inlining — files not found:', { loaderPath, binaryPath });
    return;
  }

  const wasmBase64 = readFileSync(binaryPath).toString('base64');
  const loaderSource = readFileSync(loaderPath, 'utf8');

  // Match the wasm-bindgen-emitted block that reads the binary off disk.
  // Captures any whitespace/comments wasm-bindgen emits between the two
  // statements so future loader updates don't silently bypass this step.
  const loaderPattern = /const wasmPath = `\$\{__dirname\}\/rulesengine_bg\.wasm`;\s*\nconst wasmBytes = require\('fs'\)\.readFileSync\(wasmPath\);/;
  if (!loaderPattern.test(loaderSource)) {
    throw new Error(
      'WASM inlining failed: expected `const wasmPath = `${__dirname}/...`; const wasmBytes = require(\'fs\').readFileSync(wasmPath);` in ' +
        loaderPath +
        '. wasm-bindgen output shape changed — update inlineWasmBinary() to match.'
    );
  }

  const inlined = loaderSource.replace(
    loaderPattern,
    `// WASM binary inlined at build time (see build.js inlineWasmBinary).\nconst wasmBytes = Buffer.from('${wasmBase64}', 'base64');`
  );
  writeFileSync(loaderPath, inlined);

  // Standalone .wasm is dead weight once the bytes are embedded. Drop
  // it so we don't ship two copies of the binary.
  rmSync(binaryPath);
  console.log(`✅ WASM inlined into ${loaderPath} (${wasmBase64.length} base64 chars, .wasm removed)`);
}

build();
