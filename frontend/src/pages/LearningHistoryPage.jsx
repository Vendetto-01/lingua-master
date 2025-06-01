// frontend/src/services/api.js
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
      // You can dispatch a logout action here if using context/redux
      // Example: window.location.href = '/auth'; // veya daha iyi bir yönlendirme
    }

    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred';
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      originalError: error
    });
  }
);

// API service functions
export const questionsAPI = {
  getRandomQuestions: async (limit = 10, difficulty = null) => {
    try {
      const params = { limit };
      if (difficulty && difficulty !== 'mixed') {
        params.difficulty = difficulty;
      }

      const response = await api.get('/questions/random', { params });

      if (response.data.success && response.data.questions) {
        response.data.questions.forEach((question, index) => {
          if (!question.options || !Array.isArray(question.options) || question.options.some(opt => typeof opt !== 'object' || !opt.text || !opt.originalLetter)) {
            console.warn(`Question ${index + 1} (ID: ${question.id}) has invalid options format. Expected array of {text, originalLetter}. Received:`, question.options);
          }
          if (!question.correct_answer_letter_from_db) {
            console.warn(`Question ${index + 1} (ID: ${question.id}) missing correct_answer_letter_from_db.`);
          }
          if (!question.explanation && question.explanation !== '') {
             console.info(`Question ${question.id} has no explanation`);
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
      const response = await api.get('/questions/difficulties');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkAnswer: async (questionId, selectedOriginalLetter) => {
    try {
      const response = await api.post('/questions/check', {
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
        if (data.explanation === undefined) {
          console.info('Explanation not present in checkAnswer response for question:', questionId);
        }
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getPreviousQuestions: async () => { // Bu fonksiyon Learning History için güncellenecek veya kaldırılacak
    try {
      // Bu endpoint artık /api/history/learning ile değiştirilecek.
      // Şimdilik burada bırakıyorum ama LearningHistoryPage.jsx'te yeni API kullanılacak.
      console.warn("getPreviousQuestions is deprecated. Use historyAPI.getLearningHistory instead.");
      const response = await api.get('/questions/previous');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getIncorrectQuestions: async () => { // Bu fonksiyon Weakness Training için güncellenecek
    try {
      const response = await api.get('/questions/incorrect'); // Backend'de bu endpoint'i henüz tam olarak geliştirmedik
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// User Stats API fonksiyonları
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

// YENİ: Learning History API fonksiyonları
export const historyAPI = {
  getLearningHistory: async (page = 1, limit = 10, sortBy = 'date_desc') => {
    try {
      const params = { page, limit, sortBy };
      const response = await api.get('/history/learning', { params }); // Yeni backend endpoint'i
      return response.data; // Backend'den gelen { success, data, pagination } objesini döndürür
    } catch (error) {
      console.error('Error fetching learning history:', error.message, error.originalError?.response?.data);
      throw error;
    }
  }
};


// Difficulty level utilities
export const difficultyUtils = {
  getDisplayName: (difficulty) => {
    const names = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced',
      'mixed': 'Mixed Levels'
    };
    return names[difficulty] || difficulty;
  },
  getIcon: (difficulty) => {
    const icons = {
      'beginner': '験',
      'intermediate': '識',
      'advanced': '櫨',
      'mixed': '決'
    };
    return icons[difficulty] || '答';
  },
  getColorClass: (difficulty) => {
    const colors = {
      'beginner': 'text-green-600 bg-green-100',
      'intermediate': 'text-blue-600 bg-blue-100',
      'advanced': 'text-red-600 bg-red-100',
      'mixed': 'text-purple-600 bg-purple-100'
    };
    return colors[difficulty] || 'text-gray-600 bg-gray-100';
  },
  getDescription: (difficulty) => {
    const descriptions = {
      'beginner': 'Perfect for learning basic vocabulary',
      'intermediate': 'Good for building stronger language skills',
      'advanced': 'Challenge yourself with complex vocabulary',
      'mixed': 'Questions from all difficulty levels'
    };
    return descriptions[difficulty] || 'Vocabulary questions';
  }
};

// Course type utilities
export const courseUtils = {
  parseCourseType: (courseType) => {
    if (courseType.startsWith('difficulty-')) {
      return {
        type: 'difficulty',
        difficulty: courseType.replace('difficulty-', ''),
        isGeneral: false
      };
    }
    // 'weakness-training' gibi özel türleri de buraya ekleyebiliriz ileride.
    return {
      type: 'general', // 'general' veya bilinmeyenleri 'mixed' kabul edelim
      difficulty: 'mixed',
      isGeneral: true
    };
  },
  generateCourseType: (difficulty) => {
    if (difficulty === 'mixed' || difficulty === 'Mixed Levels') { // 'Mixed Levels' kontrolü eklendi
      return 'general';
    }
    return `difficulty-${difficulty}`;
  }
};

// Question utilities
export const questionUtils = {
  validateQuestion: (question) => {
    const requiredFields = [
      'id', 'question_text', 'options', 'correct_answer_letter_from_db'
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
      hasContext: !!question.paragraph,
      hasExplanation: questionUtils.hasExplanation(question),
    };
  }
};

// Health check function
export const healthCheck = async () => {
  try {
    // baseURL'i doğrudan kullanmak yerine, axios'un kendi instance'ı dışındaki bir çağrı için tam URL oluşturuyoruz.
    const healthCheckUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '/health');
    const response = await axios.get(healthCheckUrl);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;