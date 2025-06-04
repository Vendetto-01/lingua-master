import React, { Suspense } from 'react' // Suspense eklendi
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
// Sayfa importları React.lazy ile değiştirilecek
// import AuthPage from './pages/AuthPage'
// import HomePage from './pages/HomePage'
// import QuizPage from './pages/QuizPage'
import LoadingSpinner from './components/LoadingSpinner'

// Lazy loaded page components
const AuthPage = React.lazy(() => import('./pages/AuthPage'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const QuizPage = React.lazy(() => import('./pages/QuizPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage')); // ProfilePage eklendi
// Eğer LearningHistoryPage bir route ise, o da buraya eklenebilir:
// const LearningHistoryPage = React.lazy(() => import('./pages/LearningHistoryPage'));

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
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner text="Loading page..." /></div>}>
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
  
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Eğer LearningHistoryPage bir route ise, buraya eklenebilir:
          <Route
            path="/learning-history" // Örnek path, doğru path'i kullanın
            element={
              <ProtectedRoute>
                <Layout>
                  <LearningHistoryPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          */}
  
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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