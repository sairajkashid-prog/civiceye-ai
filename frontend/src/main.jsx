import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { installDemoApi } from './demo/demoApi.js'

// Static demo build: no backend, mock API intercepts /api/*
if (import.meta.env.VITE_DEMO === 'true') installDemoApi()

const Root = import.meta.env.VITE_DEMO === 'true'
  ? HashRouter
  : HashRouter   // hash routing works on any static host (GitHub Pages, Vercel)

ReactDOM.createRoot(document.getElementById('root')).render(<Root><App /></Root>)
