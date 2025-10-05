// @ts-nocheck
/**
 * ---------------------------------------------------------------------------
 * 🧬  ePalika API Schema — Unified SDL Loader
 * ---------------------------------------------------------------------------
 * Exposes the composed GraphQL schema (index.graphql) as `typeDefs`.
 * This ensures other packages (apollo, shell, mock-db) can import a real,
 * parsed DocumentNode without dealing with raw file reads.
 * ---------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import { gql } from "graphql-tag";

// Resolve dirname in ESM: convert import.meta.url to a file path
// Use the global URL constructor (available in modern Node ESM) to avoid importing
// the 'url' module which can cause type resolution issues in some TS setups.
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const schemaPath = path.resolve(__dirname, "../index.graphql");

/** Parsed GraphQL type definitions for runtime use */
export const typeDefs = gql(fs.readFileSync(schemaPath, "utf-8")) as any;
