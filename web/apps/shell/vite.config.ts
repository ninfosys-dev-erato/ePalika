import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [
      tsconfigPaths(),
      react(),
      federation({
        name: 'shell',
        remotes: {},
        shared: {
          react: { singleton: true, requiredVersion: '^18.3.1' },
          'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
          '@apollo/client': { singleton: true },
          '@tanstack/react-query': { singleton: true },
          '@tanstack/react-router': { singleton: true },
        },
      }),
    ],
    build: {
      target: 'esnext', // or 'es2022' — supports top-level await
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            apollo: ['@apollo/client'],
            tanstack: ['@tanstack/react-query', '@tanstack/react-router'],
          },
        },
      },
    },
    server: { port: 5200 },
  }
})
