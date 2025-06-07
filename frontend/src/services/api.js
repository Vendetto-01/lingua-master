// frontend/src/services/api.js (CLEAN VERSION - Priority 3)
import axios from 'axios';
import { getAuthToken } from '../config/supabase';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000, // Increased timeout for words processing
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
      console.error('Unauthorized access - session expired');
      // Could trigger logout here if needed
    }

    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'An unexpected error occurred';
    
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      originalError: error
    });
  }
);

// MAIN API: Words-based endpoints (Primary)
export const questionsAPI = {
  getRandomQuestions: async (limit = 10, difficulty = null) => {
    try {
      const params = { limit };
      if (difficulty && difficulty !== 'mixed') {
        params.difficulty = difficulty;
      }

      console.log('🔍 Fetching words from /api/words/random:', params);
      const response = await api.get('/words/random', { params });

      if (response.data.success && response.data.questions) {
        // Validate word-based question format
        response.data.questions.forEach((question, index) => {
          if (!question.word || !question.definition) {
            console.warn(`Word ${index + 1} (ID: ${question.id}) missing essential word data.`);
          }
          if (!question.example_sentence) {
            console.warn(`Word ${index + 1} (ID: ${question.id}) missing example sentence.`);
          }
          if (!question.options || !Array.isArray(question.options)) {
            console.warn(`Word ${index + 1} (ID: ${question.id}) has invalid options format.`);
          }
          if (question.difficulty_level && !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(question.difficulty_level)) {
            console.warn(`Word ${index + 1} (ID: ${question.id}) has non-CEFR difficulty level:`, question.difficulty_level);
          }
        });
        
        console.log(`✅ Successfully loaded ${response.data.questions.length} words`);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching words:', error.message);
      throw error;
    }
  },

  getDifficultyLevels: async () => {
    try {
      console.log('🔍 Fetching difficulty levels from /api/words/difficulties');
      const response = await api.get('/words/difficulties');
      
      if (response.data.success && response.data.difficulties) {
        console.log(`✅ Found ${response.data.difficulties.length} difficulty levels:`, 
          response.data.difficulties.map(d => `${d.level} (${d.count} words)`).join(', '));
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching difficulty levels:', error.message);
      throw error;
    }
  },

  checkAnswer: async (questionId, selectedOriginalLetter) => {
    try {
      console.log(`🔍 Checking answer for word ID ${questionId}, selected: ${selectedOriginalLetter}`);
      
      const response = await api.post('/words/check', {
        questionId,
        selectedOriginalLetter
      });

      const data = response.data;
      if (data.success) {
        console.log(`✅ Answer check result: ${data.isCorrect ? 'CORRECT' : 'INCORRECT'}`);
        
        // Log word info if available
        if (data.word_info) {
          console.log(`📚 Word: "${data.word_info.word}" (${data.word_info.part_of_speech}) - ${data.word_info.definition}`);
        }
        
        const requiredFields = ['isCorrect', 'correctOriginalLetter', 'correctAnswerText'];
        const missingFields = requiredFields.filter(field => data[field] === undefined);
        
        if (missingFields.length > 0) {
          console.error('Missing required fields in checkAnswer response:', missingFields);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error checking answer:', error.message);
      throw error;
    }
  },

  // DEPRECATED: Legacy methods (kept for compatibility)
  getPreviousQuestions: async () => {
    console.warn("⚠️ getPreviousQuestions is deprecated. Use historyAPI.getLearningHistory instead.");
    try {
      const response = await api.get('/questions/previous');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getIncorrectQuestions: async () => {
    console.warn("⚠️ getIncorrectQuestions not yet implemented for words system.");
    try {
      const response = await api.get('/questions/incorrect');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  submitReportQuestion: async (reportData) => {
    try {
      console.log('🚩 Submitting question report:', reportData);
      const response = await api.post('/reports/question', reportData);
      if (response.data.success) {
        console.log('✅ Report submitted successfully:', response.data.report_id);
      }
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting question report:', error.message);
      throw error;
    }
  },

  // Weakness Training / Study List related API calls
  getWeaknessTrainingQuestions: async (limit = 10) => {
    try {
      console.log(`🧠 Fetching weakness training questions, limit: ${limit}`);
      const response = await api.get('/weakness/questions', { params: { limit } });
      if (response.data.success && response.data.questions) {
        console.log(`✅ Successfully loaded ${response.data.questions.length} weakness training questions.`);
      }
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching weakness training questions:', error.message);
      throw error;
    }
  },

  addWeaknessItem: async (word_id) => {
    try {
      console.log(`➕ Adding word ${word_id} to weakness training list.`);
      const response = await api.post('/weakness/items', { word_id });
      if (response.data.success) {
        console.log(`✅ Word ${word_id} added/updated in weakness training list.`);
      }
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding word ${word_id} to weakness training list:`, error.message);
      throw error;
    }
  },

  removeWeaknessItem: async (word_id) => {
    try {
      console.log(`➖ Removing word ${word_id} from weakness training list.`);
      const response = await api.delete(`/weakness/items/${word_id}`);
      if (response.data.success) {
        console.log(`✅ Word ${word_id} removed/marked as removed from weakness training list.`);
      }
      return response.data;
    } catch (error) {
      console.error(`❌ Error removing word ${word_id} from weakness training list:`, error.message);
      throw error;
    }
  },

  getWeaknessItemsCount: async () => {
    try {
      console.log('📊 Fetching weakness items count.');
      const response = await api.get('/weakness/items/count');
      if (response.data.success) {
        console.log(`✅ Weakness items count: ${response.data.count}`);
      }
      return response.data; // { success: true, count: N }
    } catch (error) {
      console.error('❌ Error fetching weakness items count:', error.message);
      throw error; // Propagate error to be handled by caller
    }
  },

  // Reported Questions related API calls
  getUserReportedQuestions: async (limit = 10) => {
    try {
      console.log(`📋 Fetching user's reported questions, limit: ${limit}`);
      const response = await api.get('/reports/user-questions', { params: { limit } });
      if (response.data.success && response.data.questions) {
        console.log(`✅ Successfully loaded ${response.data.questions.length} reported questions.`);
      }
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching user reported questions:', error.message);
      throw error;
    }
  },

  dismissUserReport: async (report_id) => {
    try {
      console.log(`🙈 Dismissing report ${report_id} for user.`);
      const response = await api.post(`/reports/${report_id}/dismiss`);
      if (response.data.success) {
        console.log(`✅ Report ${report_id} dismissed successfully.`);
      }
      return response.data;
    } catch (error) {
      console.error(`❌ Error dismissing report ${report_id}:`, error.message);
      throw error;
    }
  },
  
  deleteQuestion: async (questionId) => {
    try {
      console.log(`🗑️ Deleting question ID ${questionId}`);
      const response = await api.delete(`/words/${questionId}`); // Assuming endpoint is /api/words/:id for deletion
      if (response.data.success) {
        console.log(`✅ Question ${questionId} deleted successfully.`);
      }
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting question ${questionId}:`, error.message);
      throw error;
    }
  }
};

// NEW: Explicit Words API (for future use)
export const wordsAPI = {
  getRandomWords: async (limit = 10, difficulty = null) => {
    return questionsAPI.getRandomQuestions(limit, difficulty);
  },

  getDifficultyLevels: async () => {
    return questionsAPI.getDifficultyLevels();
  },

  checkWordAnswer: async (wordId, selectedOriginalLetter) => {
    return questionsAPI.checkAnswer(wordId, selectedOriginalLetter);
  },
};

// User Stats API (unchanged)
export const userStatsAPI = {
  recordQuizSession: async (sessionDetails) => {
    try {
      console.log('📝 Recording quiz session:', {
        course_type: sessionDetails.course_type,
        score: `${sessionDetails.score_correct}/${sessionDetails.score_total}`,
        questions: sessionDetails.questions_answered_details?.length || 0
      });
      
      const response = await api.post('/users/session', sessionDetails);
      
      if (response.data.success) {
        console.log('✅ Quiz session recorded successfully:', response.data.session_id);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error recording quiz session:', error.message);
      throw error;
    }
  },

  getUserDashboardStats: async () => {
    try {
      const response = await api.get('/users/dashboard-stats');
      
      if (response.data.success) {
        console.log('📊 Dashboard stats loaded:', {
          streak: response.data.streak_days,
          completedToday: response.data.completed_today,
          totalWords: response.data.total_words_available || response.data.total_questions_available
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error.message);
      throw error;
    }
  },

  getUserCourseStats: async () => {
    try {
      const response = await api.get('/users/course-stats');
      
      if (response.data.success && response.data.course_stats) {
        console.log(`📈 Course stats loaded for ${response.data.course_stats.length} courses`);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching course stats:', error.message);
      throw error;
    }
  }
};

// Learning History API
export const historyAPI = {
  getLearningHistory: async (page = 1, limit = 10, sortBy = 'date_desc') => {
    try {
      const params = { page, limit, sortBy };
      console.log('📚 Fetching learning history:', params);
      
      const response = await api.get('/history/learning', { params });
      
      if (response.data.success) {
        console.log(`✅ Learning history loaded: ${response.data.data?.length || 0} records`);
        
        // Log metadata if available
        if (response.data.metadata) {
          console.log('📊 History metadata:', response.data.metadata);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching learning history:', error.message);
      throw error;
    }
  }
};

// Utility objects (difficultyUtils, courseUtils, questionUtils) have been moved to frontend/src/utils/

// Health check function
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