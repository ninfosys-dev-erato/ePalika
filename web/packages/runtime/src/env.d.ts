/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KEYCLOAK_URL?: string
  readonly VITE_KEYCLOAK_REALM?: string
  readonly VITE_KEYCLOAK_CLIENT_ID?: string
  readonly VITE_AUTH_AUTO_LOGIN?: string
  readonly VITE_AUTH_MODE?: string
  readonly VITE_GRAPHQL_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
