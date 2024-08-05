const fs = require("fs");
const packageJson = require("./package.json");

const versionString = `export const version = "${packageJson.version}";\n`;

fs.writeFileSync("./src/version.ts", versionString);
