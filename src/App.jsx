import { Routes, Route, Navigate } from 'react-router-dom'
import Welcome from './pages/Welcome'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import ResetPassword from './pages/ResetPassword'
import ErrorBoundary from './ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen gradient-bg">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/portals" element={<LandingPage />} />
          <Route path="/auth/:role" element={<AuthPage />} />
          <Route path="/dashboard/:role" element={<Dashboard />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App
