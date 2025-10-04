import { setupWorker } from 'msw/browser'
import { dartaHandlers } from './handlers/darta'
import { chalaniHandlers } from './handlers/chalani'
import { numberingHandlers } from './handlers/numbering'

export const handlers = [
  ...dartaHandlers,
  ...chalaniHandlers,
  ...numberingHandlers,
]

export const worker = setupWorker(...handlers)

// Start MSW in development
export async function startMockServiceWorker() {
  // @ts-ignore - import.meta.env is available in Vite
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV
  
  if (isDev) {
    await worker.start({
      onUnhandledRequest: 'bypass',
      quiet: false,
    })
    console.log('🔶 MSW: Mock Service Worker started')
  }
}
