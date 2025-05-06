
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppProvider } from './context/AppContext.tsx'
import { ensureStorageBuckets } from './integrations/supabase/setupStorage.ts'

// Ensure storage buckets exist on app startup
ensureStorageBuckets().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
