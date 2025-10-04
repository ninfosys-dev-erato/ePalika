import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    federation({
      name: 'mfe_chalani',
      filename: 'remoteEntry.js',
      exposes: {
        './ChalaniCompose': './src/features/compose/ChalaniCompose',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1' },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
        '@apollo/client': { singleton: true },
        '@tanstack/react-query': { singleton: true },
        zustand: { singleton: true },
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
