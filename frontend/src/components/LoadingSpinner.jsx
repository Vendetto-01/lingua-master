import React from 'react'

const LoadingSpinner = ({ size = 'default', text = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  const textSizes = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg'
  }

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center space-y-3">
      {/* Spinner */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin`}
        ></div>
      </div>
      
      {/* Loading text */}
      {text && (
        <p className={`${textSizes[size]} text-gray-600 font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinnerContent}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinnerContent}
    </div>
  )
}

// Simple inline spinner for buttons
export const InlineSpinner = ({ size = 'small' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-5 h-5'
  }

  return (
    <div
      className={`${sizeClasses[size]} border-2 border-white border-t-transparent rounded-full animate-spin`}
    ></div>
  )
}

// Page loading component
export const PageLoader = ({ text = 'Loading page...' }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Lingua Master</h2>
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner