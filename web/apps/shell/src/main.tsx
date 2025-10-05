import React from 'react'
import ReactDOM from 'react-dom/client'
import './App.css'
import { Providers } from './app/providers'
import { AppRouter } from './app/routes/router'

// Start MSW in development (lazy loaded)
async function init() {
  if (import.meta.env.DEV) {
    // const { startMockServiceWorker } = await import('@egov/api-schema/mocks')
    // await startMockServiceWorker()
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Providers>
        <AppRouter />
      </Providers>
    </React.StrictMode>
  )
}

init()
