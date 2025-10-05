import { setupWorker } from 'msw/browser'
import { dartaHandlers } from './handlers/darta'
import { chalaniHandlers } from './handlers/chalani'
import { numberingHandlers } from './handlers/numbering'

export const handlers = [
  ...dartaHandlers,
  ...chalaniHandlers,
  ...numberingHandlers,
]

// Lazy initialize worker only when needed
let worker: ReturnType<typeof setupWorker> | null = null

// Start MSW in development
export async function startMockServiceWorker() {
  // @ts-ignore - import.meta.env is available in Vite
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

  if (isDev) {
    // Initialize worker only in browser context
    if (!worker && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      worker = setupWorker(...handlers)
    }

    if (worker) {
      await worker.start({
        quiet: false,
        // Bypass module federation and other asset requests
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
        // Only handle GraphQL requests
        onUnhandledRequest(request, print) {
          // Bypass module federation, assets, and other non-GraphQL requests
          if (
            request.url.includes('remoteEntry.js') ||
            request.url.includes('/assets/') ||
            request.url.includes('/@') ||
            request.url.includes('node_modules') ||
            request.url.includes('.js') ||
            request.url.includes('.css') ||
            request.url.includes('.svg') ||
            request.url.includes('.png') ||
            request.url.includes('.jpg')
          ) {
            return
          }

          // For all other unhandled requests, log them
          print.warning()
        },
      })
      console.log('🔶 MSW: Mock Service Worker started')
    }
  }
}

export { worker }
