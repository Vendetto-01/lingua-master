// frontend/src/services/api.js (UPDATED for words table)
import axios from 'axios';
import { getAuthToken } from '../config/supabase';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized access - redirecting to login');
    }

    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      originalError: error
    });
  }
);

// UPDATED: Words API (replaces questionsAPI but keeps same interface for compatibility)
export const questionsAPI = {
  getRandomQuestions: async (limit = 10, difficulty = null) => {
    try {
      const params = { limit };
      if (difficulty && difficulty !== 'mixed') {
        params.difficulty = difficulty;
      }

      // NEW: Use words endpoint but maintain interface compatibility
      const response = await api.get('/words/random', { params });

      if (response.data.success && response.data.questions) {
        response.data.questions.forEach((question, index) => {
          // Validate the new word-based question format
          if (!question.options || !Array.isArray(question.options) || question.options.some(opt => typeof opt !== 'object' || !opt.text || !opt.originalLetter)) {
            console.warn(`Word ${index + 1} (ID: ${question.id}) has invalid options format.`);
          }
          if (!question.word || !question.definition) {
            console.warn(`Word ${index + 1} (ID: ${question.id}) missing essential word data.`);
          }
          if (!question.example_sentence) {
            console.warn(`Word ${index + 1} (ID: ${question.id}) missing example sentence.`);
          }
        });
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDifficultyLevels: async () => {
    try {
      // NEW: Use words endpoint
      const response = await api.get('/words/difficulties');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkAnswer: async (questionId, selectedOriginalLetter) => {
    try {
      // NEW: Use words endpoint but maintain interface
      const response = await api.post('/words/check', {
        questionId,
        selectedOriginalLetter
      });

      const data = response.data;
      if (data.success) {
        const requiredFields = ['isCorrect', 'correctOriginalLetter', 'correctAnswerText'];
        const missingFields = requiredFields.filter(field => data[field] === undefined);

        if (missingFields.length > 0) {
          console.error('Missing required fields in checkAnswer response:', missingFields);
        }
        
        // NEW: Log word information if available
        if (data.word_info) {
          console.info('Word details:', data.word_info);
        }
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // LEGACY: Keep for backward compatibility
  getPreviousQuestions: async () => {
    console.warn("getPreviousQuestions is deprecated. Use historyAPI.getLearningHistory instead.");
    try {
      const response = await api.get('/questions/previous');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getIncorrectQuestions: async () => {
    try {
      const response = await api.get('/questions/incorrect');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// NEW: Words API with explicit naming (for future use)
export const wordsAPI = {
  getRandomWords: async (limit = 10, difficulty = null) => {
    try {
      const params = { limit };
      if (difficulty && difficulty !== 'mixed') {
        params.difficulty = difficulty;
      }

      const response = await api.get('/words/random', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getDifficultyLevels: async () => {
    try {
      const response = await api.get('/words/difficulties');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkWordAnswer: async (wordId, selectedOriginalLetter) => {
    try {
      const response = await api.post('/words/check', {
        questionId: wordId, // Keep same parameter name for compatibility
        selectedOriginalLetter
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// User Stats API (unchanged but updated for words context)
export const userStatsAPI = {
  recordQuizSession: async (sessionDetails) => {
    try {
      const response = await api.post('/users/session', sessionDetails);
      return response.data;
    } catch (error) {
      console.error('Error recording quiz session:', error.message, error.originalError?.response?.data);
      throw error;
    }
  },
  getUserDashboardStats: async () => {
    try {
      const response = await api.get('/users/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error.message, error.originalError?.response?.data);
      throw error;
    }
  },
  getUserCourseStats: async () => {
    try {
      const response = await api.get('/users/course-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching course stats:', error.message, error.originalError?.response?.data);
      throw error;
    }
  }
};

// Learning History API (updated for words)
export const historyAPI = {
  getLearningHistory: async (page = 1, limit = 10, sortBy = 'date_desc') => {
    try {
      const params = { page, limit, sortBy };
      const response = await api.get('/history/learning', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching learning history:', error.message, error.originalError?.response?.data);
      throw error;
    }
  }
};

// UPDATED: Difficulty level utilities (now supports CEFR levels)
export const difficultyUtils = {
  getDisplayName: (difficulty) => {
    const names = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate', 
      'advanced': 'Advanced',
      'mixed': 'Mixed Levels',
      // NEW: CEFR level support
      'A1': 'Beginner (A1)',
      'A2': 'Beginner (A2)',
      'B1': 'Intermediate (B1)',
      'B2': 'Intermediate (B2)',
      'C1': 'Advanced (C1)',
      'C2': 'Advanced (C2)'
    };
    return names[difficulty] || difficulty;
  },
  
  getIcon: (difficulty) => {
    const icons = {
      'beginner': '🌱',
      'intermediate': '🎯',
      'advanced': '🚀',
      'mixed': '🌈',
      // NEW: CEFR level icons
      'A1': '🌱',
      'A2': '🌿',
      'B1': '🎯',
      'B2': '🏹',
      'C1': '🚀',
      'C2': '🌟'
    };
    return icons[difficulty] || '📚';
  },
  
  getColorClass: (difficulty) => {
    const colors = {
      'beginner': 'text-green-600 bg-green-100',
      'intermediate': 'text-blue-600 bg-blue-100',
      'advanced': 'text-red-600 bg-red-100',
      'mixed': 'text-purple-600 bg-purple-100',
      // NEW: CEFR level colors
      'A1': 'text-green-500 bg-green-50',
      'A2': 'text-green-600 bg-green-100',
      'B1': 'text-blue-500 bg-blue-50',
      'B2': 'text-blue-600 bg-blue-100',
      'C1': 'text-red-500 bg-red-50',
      'C2': 'text-red-600 bg-red-100'
    };
    return colors[difficulty] || 'text-gray-600 bg-gray-100';
  },
  
  getDescription: (difficulty) => {
    const descriptions = {
      'beginner': 'Perfect for learning basic vocabulary',
      'intermediate': 'Good for building stronger language skills',
      'advanced': 'Challenge yourself with complex vocabulary',
      'mixed': 'Words from all difficulty levels',
      // NEW: CEFR level descriptions
      'A1': 'Basic vocabulary for everyday situations',
      'A2': 'Elementary words for common topics',
      'B1': 'Intermediate vocabulary for work and study',
      'B2': 'Upper-intermediate words for complex topics',
      'C1': 'Advanced vocabulary for professional contexts',
      'C2': 'Mastery-level words for academic and literary texts'
    };
    return descriptions[difficulty] || 'Vocabulary words';
  },

  // NEW: Map CEFR levels to our categories
  getCategoryFromCEFR: (cefrLevel) => {
    const mapping = {
      'A1': 'beginner',
      'A2': 'beginner',
      'B1': 'intermediate',
      'B2': 'intermediate',
      'C1': 'advanced',
      'C2': 'advanced'
    };
    return mapping[cefrLevel] || 'mixed';
  }
};

// Course type utilities (unchanged)
export const courseUtils = {
  parseCourseType: (courseType) => {
    if (courseType.startsWith('difficulty-')) {
      return {
        type: 'difficulty',
        difficulty: courseType.replace('difficulty-', ''),
        isGeneral: false
      };
    }
    return {
      type: 'general',
      difficulty: 'mixed',
      isGeneral: true
    };
  },
  generateCourseType: (difficulty) => {
    if (difficulty === 'mixed' || difficulty === 'Mixed Levels') {
      return 'general';
    }
    return `difficulty-${difficulty}`;
  }
};

// UPDATED: Question utilities (now word utilities)
export const questionUtils = {
  validateQuestion: (question) => {
    const requiredFields = [
      'id', 'word', 'definition', 'example_sentence', 'question_text', 'options', 'correct_answer_letter_from_db'
    ];
    if (!requiredFields.every(field => question[field] !== undefined)) return false;
    if (!Array.isArray(question.options) || question.options.some(opt => typeof opt !== 'object' || typeof opt.text !== 'string' || typeof opt.originalLetter !== 'string')) return false;
    return true;
  },

  getCorrectAnswerTextFromProcessedQuestion: (question) => {
    if (!question || !question.options || !question.correct_answer_letter_from_db) {
      return null;
    }
    const correctOption = question.options.find(opt => opt.originalLetter === question.correct_answer_letter_from_db);
    return correctOption ? correctOption.text : null;
  },

  hasExplanation: (question) => {
    return question.explanation && question.explanation.trim().length > 0;
  },

  formatQuestion: (question) => {
    return {
      ...question,
      hasContext: !!question.example_sentence, // Changed from paragraph to example_sentence
      hasExplanation: questionUtils.hasExplanation(question),
      isWordBased: true, // NEW: Indicates this is from words table
      wordDetails: { // NEW: Extract word-specific details
        word: question.word,
        partOfSpeech: question.part_of_speech,
        definition: question.definition,
        difficultyLevel: question.difficulty_level
      }
    };
  },

  // NEW: Word-specific utilities
  generateQuestionPreview: (word, partOfSpeech, exampleSentence) => {
    if (!word || !exampleSentence) return 'Question preview unavailable';
    return `What does "${word}" (${partOfSpeech}) mean in this context?`;
  },

  highlightWordInSentence: (sentence, word) => {
    if (!sentence || !word) return sentence;
    return sentence.replace(new RegExp(`\\b${word}\\b`, 'gi'), `**${word}**`);
  }
};

// Health check function (unchanged)
export const healthCheck = async () => {
  try {
    const healthCheckUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '/health');
    const response = await axios.get(healthCheckUrl);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;