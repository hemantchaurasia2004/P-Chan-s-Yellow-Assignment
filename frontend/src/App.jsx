import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProjectDetail from './pages/ProjectDetail'
import Chat from './pages/Chat'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="loading-dots flex gap-2">
          <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
          <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
          <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Public Route Component (redirects to dashboard if logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pattern">
        <div className="loading-dots flex gap-2">
          <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
          <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
          <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
        </div>
      </div>
    )
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

export default function App() {
  return (
    <div className="min-h-screen bg-pattern">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId" element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/project/:projectId/chat/:sessionId" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}
