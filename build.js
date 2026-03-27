// build.js
const esbuild = require('esbuild');
const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');

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
  ],
  tsconfig: './tsconfig.json',
};

async function build() {
  try {
    // Inline WASM as base64 for Cloudflare Workers compatibility
    console.log('🔧 Generating base64-encoded WASM module...');
    const wasmBytes = readFileSync('src/wasm/rulesengine_bg.wasm');
    const wasmBase64 = wasmBytes.toString('base64');
    writeFileSync('src/wasm/rulesengine_bg_wasm_base64.js', `module.exports = "${wasmBase64}";\n`);
    console.log('✅ Base64 WASM module generated');

    // Build CommonJS version with esbuild
    // rulesengine.js is already patched by the download script with initWasm()
    await esbuild.build({
      ...sharedConfig,
      outfile: 'dist/index.js',
      format: 'cjs',
    });

    console.log('✅ JavaScript build completed with esbuild');

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

build();