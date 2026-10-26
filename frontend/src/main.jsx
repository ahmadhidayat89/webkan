import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.jsx'
import './index.css'
import { i18nReady } from './i18n'
import './utils/authFetch';

try {
  await i18nReady

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </React.StrictMode>,
  )
} catch (error) {
  console.error('Failed to initialize i18n:', error)
}
