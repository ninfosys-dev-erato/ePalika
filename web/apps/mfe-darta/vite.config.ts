import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    federation({
      name: 'mfe_darta',
      filename: 'remoteEntry.js',
      manifest: false,
      exposes: {
        './DartaIntake': './src/features/intake/DartaIntake.tsx',
        './DartaList': './src/features/list/DartaList.tsx',
        './TriageInbox': './src/features/triage/TriageInbox.tsx',
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.3.1',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.1',
        },
        '@apollo/client': {
          singleton: true,
          requiredVersion: '^4.0.6',
          strictVersion: true,
        },
        '@tanstack/react-query': {
          singleton: true,
        },
        'zustand': {
          singleton: true,
        },
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
