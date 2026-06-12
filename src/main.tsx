import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App' // Notice the curly braces around App!

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)