#!/usr/bin/env node
/**
 * =============================================================================
 * 🏢 ePalika GraphQL Schema Composer — Enterprise Edition v2.0
 * =============================================================================
 * Purpose:
 *   Aggregates all GraphQL SDL fragments (Darta, Chalani, Identity, Common, etc.)
 *   into a single unified schema for both runtime (gateway) and tooling (mock,
 *   codegen, validation). Prevents schema drift and guarantees type integrity.
 *
 * Features:
 *   • Recursive SDL discovery across domain folders
 *   • Timing metrics & detailed logging
 *   • Graceful error handling
 *   • CI-friendly progress feedback
 * =============================================================================
 */

import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { print } from "graphql";

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------
const ROOT_DIR = path.resolve("./packages/api-schema");
const OUTPUT_FILE = path.join(ROOT_DIR, "index.graphql");
const SEARCH_PATTERN = `${ROOT_DIR}/**/*.graphql`;

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🧩  Initiating GraphQL Schema Composition Workflow");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`📂  Schema Root:         ${ROOT_DIR}`);
console.log(`🔎  Search Pattern:      ${SEARCH_PATTERN}`);
console.log(`📝  Output Destination:  ${OUTPUT_FILE}`);
console.log("----------------------------------------------------------------");

const start = performance.now();

try {
  // Step 1 — Validate existence of schema directory
  if (!fs.existsSync(ROOT_DIR)) {
    throw new Error(`Schema root directory not found: ${ROOT_DIR}`);
  }

  console.log("⏳  Scanning for SDL fragments...");
  const files = loadFilesSync(SEARCH_PATTERN, { recursive: true, ignoreIndex: true });

  if (!files.length) {
    console.warn("⚠️  No SDL (.graphql) files detected. Nothing to compose.");
    process.exit(1);
  }

  console.log(`📦  Found ${files.length} SDL fragment(s). Beginning merge process...`);

  // Step 2 — Merge definitions
  const merged = mergeTypeDefs(files, { useSchemaDefinition: true });

  // Step 3 — Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  fs.mkdirSync(outputDir, { recursive: true });

  // Step 4 — Write unified schema
  fs.writeFileSync(OUTPUT_FILE, print(merged), "utf-8");

  const end = performance.now();
  const duration = ((end - start) / 1000).toFixed(2);

  console.log("----------------------------------------------------------------");
  console.log("✅  Schema composition completed successfully!");
  console.log(`🕒  Duration:            ${duration}s`);
  console.log(`📁  Unified schema path: ${OUTPUT_FILE}`);
  console.log("----------------------------------------------------------------");
  console.log("🧠  Next Actions:");
  console.log("   • Run `pnpm graphql-codegen` to regenerate type-safe hooks");
  console.log("   • Validate via GraphQL Inspector or CI Schema Registry");
  console.log("   • Consume via SchemaLink (mock) or HTTPLink (real) client");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✨  Composition workflow complete — ready for integration.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

} catch (err) {
  console.error("❌  Schema composition failed due to an unrecoverable error.\n");
  console.error(`Error Message: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
}
