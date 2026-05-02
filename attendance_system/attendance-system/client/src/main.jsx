import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import Portal from './pages/Portal'
import Kiosk from './pages/Kiosk'
import AdminLogin from './pages/AdminLogin'
import Landing from './pages/Landing'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/admin" element={<App />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/kiosk" element={<Kiosk />} />
        <Route path="/admin-login" element={<AdminLogin />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)