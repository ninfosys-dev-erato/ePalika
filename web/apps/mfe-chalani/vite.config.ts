import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    federation({
      name: 'mfe_chalani',
      filename: 'remoteEntry.js',
      manifest: true,
      exposes: {
        './ChalaniCompose': './src/features/compose/ChalaniCompose.tsx',
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
  },
  server: {
    port: 5202,
    cors: true,
  },
  preview: {
    port: 5202,
  },
})
