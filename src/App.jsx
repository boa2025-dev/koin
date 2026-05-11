import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AddTransactionSheet from './components/ui/AddTransactionSheet'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/app/Dashboard'
import Transactions from './pages/app/Transactions'
import Budgets from './pages/app/Budgets'
import Goals from './pages/app/Goals'
import Analytics from './pages/app/Analytics'
import AppSettings from './pages/app/AppSettings'

export default function App() {
  return (
    <BrowserRouter>
      {/* SVG filter for liquid-glass backdrop refraction */}
      <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden>
        <defs>
          <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="n" />
            <feGaussianBlur in="n" stdDeviation="2" result="sn" />
            <feDisplacementMap in="SourceGraphic" in2="sn" scale="14" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <AddTransactionSheet />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#13161F',
            color: '#F0F0F5',
            border: '1px solid rgba(255,255,255,0.1)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#2FFFA0', secondary: '#13161F' } },
          error: { iconTheme: { primary: '#FF6B6B', secondary: '#13161F' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard"    element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budgets"      element={<Budgets />} />
          <Route path="goals"        element={<Goals />} />
          <Route path="analytics"    element={<Analytics />} />
          <Route path="settings"     element={<AppSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
