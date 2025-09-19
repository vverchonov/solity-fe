import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Mute console.log and console.info in production
// Only allow errors and warnings
if (import.meta.env.NODE_ENV !== 'development') {
  console.log = () => { };
  console.info = () => { };
  console.debug = () => { };
  console.trace = () => { };
}

createRoot(document.getElementById('root')).render(
  <App />
)
