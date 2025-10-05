import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import { ChalaniCompose } from './features/compose/ChalaniCompose'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: 16 }}>
      <div style={{ marginTop: 24 }}>
        <ChalaniCompose />
      </div>
    </div>
  </React.StrictMode>
)
