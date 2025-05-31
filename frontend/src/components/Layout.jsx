import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Layout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/auth')
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="text-2xl font-bold text-gradient">
                Lingua Master
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.email?.split('@')[0] || 'User'}
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-3">
                <div className="text-sm text-gray-600 px-3">
                  Welcome, {user?.email?.split('@')[0] || 'User'}
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer (optional) */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            © 2024 Lingua Master. Made with ❤️ for English learners.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout