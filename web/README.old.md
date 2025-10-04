npm install -g corepack
corepack enable
corepack prepare pnpm@9 --activate
pnpm -v
git init -b main


pnpm add -w @carbon/react @carbon/styles
pnpm add -Dw sass vite vite-plugin-beasties vite-tsconfig-paths

pnpm --filter @egov/shell add @tanstack/react-router @tanstack/react-query
pnpm --filter @egov/shell add @apollo/client graphql keycloak-js
pnpm --filter @egov/shell add @vitejs/plugin-react @originjs/vite-plugin-federation
pnpm --filter @egov/shell add -D vite-plugin-critical sass vite-tsconfig-paths

pnpm add @egov/design-system@workspace:* --filter @egov/shell

pnpm add -Dw react@18.3.1 react-dom@18.3.1 react-is@18.3.1

pnpm add -w @tanstack/react-query-persist-client idb-keyval
pnpm add -w js-sha256

