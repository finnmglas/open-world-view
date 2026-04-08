/**
 * Copies the Cesium built assets (Workers, Assets, Widgets, ThirdParty)
 * from node_modules into public/cesium/ so Next.js can serve them statically.
 *
 * Run: node scripts/setup-cesium.mjs
 * Skips if Workers/ already exists (re-run with --force to overwrite).
 */

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src  = join(root, "node_modules", "cesium", "Build", "Cesium");
const dest = join(root, "public", "cesium");

const force = process.argv.includes("--force");

if (!existsSync(src)) {
  console.error("❌  cesium package not found in node_modules. Run pnpm install first.");
  process.exit(1);
}

if (!force && existsSync(join(dest, "Workers"))) {
  console.log("✔  Cesium assets already present at public/cesium/ — skipping.");
  console.log("   Run with --force to overwrite.");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });

for (const dir of ["Workers", "Assets", "Widgets", "ThirdParty"]) {
  process.stdout.write(`   Copying ${dir}...`);
  cpSync(join(src, dir), join(dest, dir), { recursive: true, force: true });
  console.log(" done.");
}

console.log("✔  Cesium assets ready at public/cesium/");
