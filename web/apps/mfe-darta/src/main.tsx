import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'

// Standalone dev mode
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: 16 }}>
      <h1>🚧 MFE-Darta Standalone Mode</h1>
      <p>This MFE is designed to be loaded by the shell app.</p>
      <p>Run the shell app to see the Darta intake features.</p>
    </div>
  </React.StrictMode>
)
