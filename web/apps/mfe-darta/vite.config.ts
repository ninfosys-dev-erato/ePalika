import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    federation({
      name: 'mfe_darta',
      filename: 'remoteEntry.js',
      exposes: {
        './DartaIntake': './src/features/intake/DartaIntake',
        './DartaList': './src/features/list/DartaList',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1' },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
        '@apollo/client': { singleton: true },
        '@tanstack/react-query': { singleton: true },
        'zustand': { singleton: true },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Camera/scanner libraries (lazy loaded)
          if (id.includes('scanner') || id.includes('camera')) {
            return 'chunk-camera'
          }
        },
      },
    },
  },
  server: {
    port: 5201,
    cors: true,
  },
  preview: {
    port: 5201,
  },
})
