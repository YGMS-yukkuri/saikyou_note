import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import ListPage from './pages/List'
import RandomPage from './pages/Random'
import './styles.css'
import NetworkStatus from './components/NetworkStatus'
function App() {
  return (
    <BrowserRouter>
      {/* Network status banner */}
      <div>
        <React.Suspense fallback={null}>
          <NetworkStatus />
        </React.Suspense>
      </div>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/random" element={<RandomPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
