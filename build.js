// build.js
const esbuild = require('esbuild');
const { execSync } = require('child_process');
const { copyFileSync } = require('fs');

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
    'readable-stream'
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

    // Copy WASM files to dist
    console.log('🔧 Copying WASM files...');
    copyFileSync('src/wasm/rulesengine_bg.wasm', 'dist/rulesengine_bg.wasm');
    console.log('✅ WASM files copied');

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