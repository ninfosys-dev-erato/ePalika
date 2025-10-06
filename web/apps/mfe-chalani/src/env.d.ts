/// <reference types="vite/client" />

// Provide a minimal ImportMetaEnv interface so `import.meta.env` is typed.
interface ImportMetaEnv {
  readonly MODE: string
  readonly DEV: boolean
  readonly VITE_BASE_PATH?: string
  // add other environment variables you rely on here, e.g.
  // readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Allow importing SCSS modules and SASS files without type errors.
declare module '*.scss' {
  const content: { [className: string]: string }
  export default content
}

// If the design-system package exposes plain styles without types, declare the path explicitly.
declare module '@egov/design-system/styles.scss' {
  const content: { [className: string]: string }
  export default content
}
