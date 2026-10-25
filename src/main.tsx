/**
 * Application entry point.
 *
 * Loads the Geist font, initializes i18n before rendering, and mounts the
 * React app into `#root`.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@/i18n'
import { App } from '@/app/App'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element "#root" was not found in index.html.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
