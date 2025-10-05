import fs from "fs";
import path from "path";
import { print } from "graphql";
import { loadFilesSync, mergeTypeDefs } from "@graphql-tools/load-files";

const schemaDir = path.resolve("./packages/api-schema");
const files = loadFilesSync(`${schemaDir}/**/*.graphql`, { ignoreIndex: true });
const merged = mergeTypeDefs(files);

fs.writeFileSync(path.join(schemaDir, "index.graphql"), print(merged));
console.log("✅ schema composed → packages/api-schema/index.graphql");
