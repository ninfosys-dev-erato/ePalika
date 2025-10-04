import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import tsconfigPaths from 'vite-tsconfig-paths'
// import { perfBudgetPlugin } from '@egov/perf-budget/vite-plugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [
      tsconfigPaths(),
      react(),
      federation({
        name: 'shell',
        remotes: {
          mfe_darta: mode === 'development'
            ? 'http://localhost:5201/assets/remoteEntry.js'
            : `${env.VITE_MFE_DARTA_URL || ''}/assets/remoteEntry.js`,
        },
        shared: {
          react: { singleton: true, requiredVersion: '^18.3.1' },
          'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
          '@apollo/client': { singleton: true },
          '@tanstack/react-query': { singleton: true },
          '@tanstack/react-router': { singleton: true },
          'zustand': { singleton: true },
        },
      }),
      // TODO: Re-enable after fixing ESM imports
      // perfBudgetPlugin({
      //   distPath: 'dist',
      //   mode: process.env.CI === 'true' ? 'error' : 'warn',
      // }),
    ],
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // Core React (keep together for better caching)
              if (id.includes('react/') && !id.includes('react-dom')) {
                return 'vendor-react-core'
              }
              if (id.includes('react-dom')) {
                return 'vendor-react-dom'
              }
              if (id.includes('scheduler')) {
                return 'vendor-react-core'
              }

              // Apollo & GraphQL
              if (id.includes('@apollo/client')) {
                return 'vendor-apollo'
              }
              if (id.includes('graphql')) {
                return 'vendor-graphql'
              }

              // TanStack
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-query'
              }
              if (id.includes('@tanstack/react-router')) {
                return 'vendor-router'
              }

              // Auth
              if (id.includes('keycloak')) {
                return 'vendor-auth'
              }

              // Carbon Design System
              if (id.includes('@carbon/')) {
                return 'vendor-carbon'
              }

              // Animation
              if (id.includes('framer-motion')) {
                return 'vendor-motion'
              }

              // MSW (dev only, should be tree-shaken in prod)
              if (id.includes('msw')) {
                return 'vendor-msw'
              }

              // State management
              if (id.includes('zustand') || id.includes('immer')) {
                return 'vendor-state'
              }

              // Other small utilities
              return 'vendor-utils'
            }

            // Workspace packages (async chunks)
            if (id.includes('packages/graphql-schema')) {
              return 'lib-schema'
            }
            if (id.includes('packages/ui-mobile')) {
              return 'lib-ui'
            }
          },
        },
      },
    },
    server: {
      port: 5200,
      strictPort: true,
      // Proxy MFE dev servers for unified development
      proxy: mode === 'development' ? {
        '/mfe-darta-dev': {
          target: 'http://localhost:5201',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mfe-darta-dev/, ''),
          ws: true, // Enable WebSocket for HMR
        },
        // Future MFEs
        '/mfe-chalani-dev': {
          target: 'http://localhost:5202',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mfe-chalani-dev/, ''),
          ws: true,
        },
      } : {},
    },
  }
})
