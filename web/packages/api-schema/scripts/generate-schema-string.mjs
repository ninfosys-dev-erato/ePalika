#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the GraphQL schema
const schemaPath = resolve(__dirname, '../index.graphql');
const schemaContent = readFileSync(schemaPath, 'utf-8');

// Escape backticks and template literals
const escapedSchema = schemaContent.replace(/`/g, '\\`').replace(/\$/g, '\\$');

// Generate the TypeScript file
const output = `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from index.graphql by scripts/generate-schema-string.mjs
 */

import { gql } from "graphql-tag";

const schemaString = \`${escapedSchema}\`;

export const typeDefs = gql(schemaString) as any;
`;

// Write the output file
const outputPath = resolve(__dirname, '../src/schema-string.ts');
writeFileSync(outputPath, output, 'utf-8');

console.log('✅ Generated schema-string.ts');
