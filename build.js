// build.js
const esbuild = require('esbuild');
const { execSync } = require('child_process');
const { cpSync, mkdirSync, existsSync } = require('fs');

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
