import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { InlineSpinner } from '../components/LoadingSpinner'

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { signIn, signUp } = useAuth()

  const validateForm = () => {
    if (!email || !password) {
      setError('Email and password are required')
      return false
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.')
          setEmail('')
          setPassword('')
          setConfirmPassword('')
        }
      } else {
        const { data, error } = await signIn(email, password)
        if (error) {
          setError(error.message)
        }
        // If successful, user will be redirected by the AuthContext
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">
            Lingua Master
          </h1>
          <p className="text-gray-600">
            Master English vocabulary with interactive quizzes
          </p>
        </div>

        {/* Auth Form */}
        <div className="card-elevated">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600 mt-2">
              {isSignUp 
                ? 'Start your English learning journey today' 
                : 'Sign in to continue learning'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-danger-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-success-700 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter your password"
                disabled={isLoading}
                required
              />
            </div>

            {/* Confirm Password Field (Sign Up only) */}
            {isSignUp && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <InlineSpinner />
                  <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={toggleMode}
                disabled={isLoading}
                className="ml-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Start learning English vocabulary today!</p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage