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
      
      // 🔍 VALIDATION: Check if questions have required new fields
      if (response.data.success && response.data.questions) {
        response.data.questions.forEach((question, index) => {
          // Validate correct_answer_index exists
          if (question.correct_answer_index === undefined || question.correct_answer_index === null) {
            console.warn(`Question ${index + 1} missing correct_answer_index:`, question.id)
          }
          
          // Log if explanation is missing (not critical, but good to know)
          if (!question.explanation) {
            console.info(`Question ${question.id} has no explanation`)
          }
        })
      }
      
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

  // Check answer for a specific question - 🆕 UPDATED to handle new response format
  checkAnswer: async (questionId, selectedIndex) => {
    try {
      const response = await api.post('/questions/check', {
        questionId,
        selectedIndex
      })
      
      // 🔍 VALIDATION: Ensure response has required fields
      const data = response.data
      if (data.success) {
        // Validate required fields from new API response
        const requiredFields = ['isCorrect', 'correctAnswerIndex', 'correctAnswerText']
        const missingFields = requiredFields.filter(field => data[field] === undefined)
        
        if (missingFields.length > 0) {
          console.error('Missing required fields in checkAnswer response:', missingFields)
        }
        
        // 🆕 NEW FIELDS available in response:
        // - correctAnswerLetter: Original letter (A, B, C, D)
        // - explanation: Answer explanation (if available)
        if (data.explanation) {
          console.info('Explanation available for question:', questionId)
        }
      }
      
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

// 🆕 NEW: Question utilities for handling new question format
export const questionUtils = {
  // Validate question object has required fields
  validateQuestion: (question) => {
    const requiredFields = [
      'id', 'question_text', 'options', 'correct_answer_index'
    ]
    
    return requiredFields.every(field => question[field] !== undefined)
  },

  // Get correct answer text from question
  getCorrectAnswerText: (question) => {
    if (!question.options || question.correct_answer_index === undefined) {
      return null
    }
    return question.options[question.correct_answer_index]
  },

  // Check if question has explanation
  hasExplanation: (question) => {
    return question.explanation && question.explanation.trim().length > 0
  },

  // Format question for display
  formatQuestion: (question) => {
    return {
      ...question,
      hasContext: !!question.paragraph,
      hasExplanation: questionUtils.hasExplanation(question),
      correctAnswerText: questionUtils.getCorrectAnswerText(question)
    }
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