import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Workspace-level Vite config for unified dev server
 *
 * This serves all MFEs from a single dev server with proper HMR.
 * In dev mode: Shell serves on :5200, MFEs are built and served as static assets
 * In prod mode: Each MFE deployed independently
 */
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5200,
    strictPort: true,

    // Proxy MFE remote entries to their build outputs
    proxy: {
      '/mfe-darta': {
        target: 'http://localhost:5201',
        changeOrigin: true,
        ws: true, // WebSocket for HMR
      },
      '/mfe-chalani': {
        target: 'http://localhost:5202',
        changeOrigin: true,
        ws: true,
      },
      '/mfe-registry': {
        target: 'http://localhost:5203',
        changeOrigin: true,
        ws: true,
      },
      '/mfe-audit': {
        target: 'http://localhost:5204',
        changeOrigin: true,
        ws: true,
      },
      '/mfe-fy': {
        target: 'http://localhost:5205',
        changeOrigin: true,
        ws: true,
      },
    },
  },

  // Build all apps together
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
