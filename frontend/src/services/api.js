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
      console.error('Unauthorized access - redirecting to login')
      // You can dispatch a logout action here if using context/redux
    }

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
  getRandomQuestions: async (limit = 10, difficulty = null) => {
    try {
      const params = { limit }
      if (difficulty && difficulty !== 'mixed') {
        params.difficulty = difficulty
      }

      const response = await api.get('/questions/random', { params })

      // VALIDATION: Check if questions have required new fields (options as objects)
      if (response.data.success && response.data.questions) {
        response.data.questions.forEach((question, index) => {
          if (!question.options || !Array.isArray(question.options) || question.options.some(opt => typeof opt !== 'object' || !opt.text || !opt.originalLetter)) {
            console.warn(`Question ${index + 1} (ID: ${question.id}) has invalid options format. Expected array of {text, originalLetter}. Received:`, question.options);
          }
          if (!question.correct_answer_letter_from_db) {
            console.warn(`Question ${index + 1} (ID: ${question.id}) missing correct_answer_letter_from_db.`);
          }
          if (!question.explanation && question.explanation !== '') { // Allow empty string for explanation
             console.info(`Question ${question.id} has no explanation`);
          }
        });
      }
      return response.data
    } catch (error) {
      throw error
    }
  },

  getDifficultyLevels: async () => {
    try {
      const response = await api.get('/questions/difficulties')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // UPDATED to send selectedOriginalLetter instead of selectedIndex
  checkAnswer: async (questionId, selectedOriginalLetter) => {
    try {
      const response = await api.post('/questions/check', {
        questionId,
        selectedOriginalLetter // Changed from selectedIndex
      })

      // VALIDATION: Ensure response has required fields from new API response
      const data = response.data
      if (data.success) {
        const requiredFields = ['isCorrect', 'correctOriginalLetter', 'correctAnswerText']
        const missingFields = requiredFields.filter(field => data[field] === undefined)

        if (missingFields.length > 0) {
          console.error('Missing required fields in checkAnswer response:', missingFields)
          // Potentially throw an error or return a modified error object
        }

        if (data.explanation === undefined) { // Explanation can be null or empty string
          console.info('Explanation not present in checkAnswer response for question:', questionId)
        }
      }
      return response.data
    } catch (error) {
      throw error
    }
  },

  getPreviousQuestions: async () => {
    try {
      const response = await api.get('/questions/previous')
      return response.data
    } catch (error) {
      throw error
    }
  },

  getIncorrectQuestions: async () => {
    try {
      const response = await api.get('/questions/incorrect')
      return response.data
    } catch (error) {
      throw error
    }
  },

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
  getDisplayName: (difficulty) => {
    const names = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced',
      'mixed': 'Mixed Levels'
    }
    return names[difficulty] || difficulty
  },
  getIcon: (difficulty) => {
    const icons = {
      'beginner': '🌱',
      'intermediate': '🎯',
      'advanced': '🔥',
      'mixed': '🌈'
    }
    return icons[difficulty] || '📚'
  },
  getColorClass: (difficulty) => {
    const colors = {
      'beginner': 'text-green-600 bg-green-100',
      'intermediate': 'text-blue-600 bg-blue-100',
      'advanced': 'text-red-600 bg-red-100',
      'mixed': 'text-purple-600 bg-purple-100'
    }
    return colors[difficulty] || 'text-gray-600 bg-gray-100'
  },
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
  generateCourseType: (difficulty) => {
    if (difficulty === 'mixed') {
      return 'general'
    }
    return `difficulty-${difficulty}`
  }
}

// Question utilities
export const questionUtils = {
  // Validate question object has required fields
  validateQuestion: (question) => {
    const requiredFields = [
      'id', 'question_text', 'options', 'correct_answer_letter_from_db'
    ];
    if (!requiredFields.every(field => question[field] !== undefined)) return false;
    if (!Array.isArray(question.options) || question.options.some(opt => typeof opt !== 'object' || typeof opt.text !== 'string' || typeof opt.originalLetter !== 'string')) return false;
    return true;
  },

  // Get correct answer text from question object (using the originalLetter and options array)
  getCorrectAnswerTextFromProcessedQuestion: (question) => {
    if (!question || !question.options || !question.correct_answer_letter_from_db) {
      return null;
    }
    const correctOption = question.options.find(opt => opt.originalLetter === question.correct_answer_letter_from_db);
    return correctOption ? correctOption.text : null;
  },

  hasExplanation: (question) => {
    return question.explanation && question.explanation.trim().length > 0
  },

  formatQuestion: (question) => {
    return {
      ...question,
      hasContext: !!question.paragraph,
      hasExplanation: questionUtils.hasExplanation(question),
      // correctAnswerText will now be more reliably set in QuizPage from API response
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