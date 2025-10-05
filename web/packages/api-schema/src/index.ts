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

const schemaPath = path.resolve(import.meta.dirname, "../index.graphql");

/** Parsed GraphQL type definitions for runtime use */
export const typeDefs = gql(fs.readFileSync(schemaPath, "utf-8"));
