import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import { ChalaniCompose } from './features/compose/ChalaniCompose'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ padding: 16 }}>
      <h1>🚧 MFE-Chalani Standalone Mode</h1>
      <p>यो माइक्रो-फ्रन्टएन्ड मुख्य शेलबाट लोड हुन्छ।</p>
      <p>Standalone पूर्वावलोकनका लागि तल Compose स्क्रीन:</p>
      <div style={{ marginTop: 24 }}>
        <ChalaniCompose />
      </div>
    </div>
  </React.StrictMode>
)
