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
  // Get random questions for general quiz
  getRandomQuestions: async (limit = 10) => {
    try {
      const response = await api.get('/questions/random', {
        params: { limit }
      })
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