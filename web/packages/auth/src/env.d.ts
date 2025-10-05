// src/env.d.ts
interface ImportMetaEnv {
  readonly VITE_AUTH_ADAPTER: "simulated" | "live";
  readonly VITE_KEYCLOAK_URL?: string;
  readonly VITE_KEYCLOAK_REALM?: string;
  readonly VITE_KEYCLOAK_CLIENT_ID?: string;
  readonly VITE_SILENT_CHECK_SSO_URI?: string;
  readonly VITE_AUTO_LOGIN?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
