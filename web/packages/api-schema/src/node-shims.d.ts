// Lightweight module shims for environments that don't have @types/node
// This prevents TS errors like "Cannot find module 'fs' or its corresponding type declarations.".
declare module "fs" {
  const fs: any;
  export = fs;
}

declare module "path" {
  const path: any;
  export = path;
}

declare module "url" {
  const url: any;
  export = url;
}

export {};
