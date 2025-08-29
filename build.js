// build.js
const esbuild = require('esbuild');
const { execSync } = require('child_process');

const sharedConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18.19',
  minify: true,
  sourcemap: 'external',
  external: [
    // Keep dependencies external since this is a library
    'url-join',
    'form-data',
    'formdata-node', 
    'node-fetch',
    'qs',
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