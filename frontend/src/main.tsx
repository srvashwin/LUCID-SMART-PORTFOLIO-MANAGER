import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.onerror = function (msg, _url, _line, _col, error) {
  const d = document.createElement('div')
  d.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ef4444;color:white;padding:20px;font-family:monospace;z-index:99999;white-space:pre-wrap;font-size:14px'
  d.textContent = `Error: ${msg}\n${error?.stack || ''}`
  document.body.prepend(d)
  return false
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
