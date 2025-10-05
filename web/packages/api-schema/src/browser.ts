/**
 * ---------------------------------------------------------------------------
 * 🧬  ePalika API Schema — Browser Entry Point
 * ---------------------------------------------------------------------------
 * Browser-compatible export that uses Vite's raw import to load the schema
 * at build time, avoiding Node.js fs/path modules.
 * ---------------------------------------------------------------------------
 */

import { gql } from "graphql-tag";
// @ts-ignore - Vite handles ?raw imports
import schemaString from "../index.graphql?raw";

/** Parsed GraphQL type definitions for runtime use */
export const typeDefs = gql(schemaString) as any;
