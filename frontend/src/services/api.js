import axios from 'axios'
import { getAuthToken } from '../config/supabase'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error getting auth token:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - redirecting to login')
      // You can dispatch a logout action here if using context/redux
    }
    
    // Return a more user-friendly error object
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred'
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      originalError: error
    })
  }
)

// API service functions
export const questionsAPI = {
  // Get random questions for quiz with optional difficulty filter
  getRandomQuestions: async (limit = 10, difficulty = null) => {
    try {
      const params = { limit }
      if (difficulty && difficulty !== 'mixed') {
        params.difficulty = difficulty
      }
      
      const response = await api.get('/questions/random', { params })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get available difficulty levels with question counts
  getDifficultyLevels: async () => {
    try {
      const response = await api.get('/questions/difficulties')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Check answer for a specific question
  checkAnswer: async (questionId, selectedIndex) => {
    try {
      const response = await api.post('/questions/check', {
        questionId,
        selectedIndex
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get previously answered questions (placeholder)
  getPreviousQuestions: async () => {
    try {
      const response = await api.get('/questions/previous')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get incorrectly answered questions (placeholder)
  getIncorrectQuestions: async () => {
    try {
      const response = await api.get('/questions/incorrect')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get user quiz statistics (placeholder)
  getUserStats: async () => {
    try {
      const response = await api.get('/questions/stats')
      return response.data
    } catch (error) {
      throw error
    }
  }
}

// Difficulty level utilities
export const difficultyUtils = {
  // Get difficulty display name
  getDisplayName: (difficulty) => {
    const names = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate', 
      'advanced': 'Advanced',
      'mixed': 'Mixed Levels'
    }
    return names[difficulty] || difficulty
  },

  // Get difficulty icon
  getIcon: (difficulty) => {
    const icons = {
      'beginner': '🌱',
      'intermediate': '🎯', 
      'advanced': '🔥',
      'mixed': '🌈'
    }
    return icons[difficulty] || '📚'
  },

  // Get difficulty color class for Tailwind
  getColorClass: (difficulty) => {
    const colors = {
      'beginner': 'text-green-600 bg-green-100',
      'intermediate': 'text-blue-600 bg-blue-100',
      'advanced': 'text-red-600 bg-red-100', 
      'mixed': 'text-purple-600 bg-purple-100'
    }
    return colors[difficulty] || 'text-gray-600 bg-gray-100'
  },

  // Get difficulty description
  getDescription: (difficulty) => {
    const descriptions = {
      'beginner': 'Perfect for learning basic vocabulary',
      'intermediate': 'Good for building stronger language skills',
      'advanced': 'Challenge yourself with complex vocabulary',
      'mixed': 'Questions from all difficulty levels'
    }
    return descriptions[difficulty] || 'Vocabulary questions'
  }
}

// Course type utilities
export const courseUtils = {
  // Parse course type and extract difficulty
  parseCourseType: (courseType) => {
    if (courseType.startsWith('difficulty-')) {
      return {
        type: 'difficulty',
        difficulty: courseType.replace('difficulty-', ''),
        isGeneral: false
      }
    }
    
    return {
      type: 'general',
      difficulty: 'mixed',
      isGeneral: true
    }
  },

  // Generate course type string from difficulty
  generateCourseType: (difficulty) => {
    if (difficulty === 'mixed') {
      return 'general'
    }
    return `difficulty-${difficulty}`
  }
}

// Health check function
export const healthCheck = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/health`)
    return response.data
  } catch (error) {
    throw error
  }
}

export default api