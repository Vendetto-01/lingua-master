import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import LoadingSpinner from './components/LoadingSpinner'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return isAuthenticated ? children : <Navigate to="/auth" replace />
}

// Public Route Component (redirect to home if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return !isAuthenticated ? children : <Navigate to="/" replace />
}

// Main App Router Component
const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/auth" 
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          } 
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <HomePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/quiz/:courseType"
          element={
            <ProtectedRoute>
              <Layout>
                <QuizPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AppRouter />
      </div>
    </AuthProvider>
  )
}

export default App