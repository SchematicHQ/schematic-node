// Sourced from package.json so it stays in sync with whatever Fern bumps on
// regeneration. require() (rather than import) sidesteps tsconfig's rootDir
// constraint; esbuild inlines the JSON at build time.
const pkg = require("../package.json") as { name: string; version: string };

export const SDK_NAME: string = pkg.name;
export const SDK_VERSION: string = pkg.version;
