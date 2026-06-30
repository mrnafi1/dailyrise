import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// লজিক: PWA এর জন্য Service Worker সঠিকভাবে রেজিস্টার করা এবং ট্র্যাক করা
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW Registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('SW Registration failed:', error);
      });
  })
}