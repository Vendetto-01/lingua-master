// backend/routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const questionsRoutes = require('./questions');
const userRoutes = require('./user');
const historyRoutes = require('./history'); // YENİ: History route'larını import et

// API Routes
router.use('/questions', questionsRoutes);
router.use('/users', userRoutes);
router.use('/history', historyRoutes); // YENİ: History route'larını kullan

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Lingua Master API',
    version: '1.0.0',
    endpoints: {
      questions: {
        'GET /api/questions/random': {
          description: 'Get random questions for quiz',
          parameters: {
            limit: 'Number of questions (optional, default: 10)',
            difficulty: 'Difficulty level (optional: beginner, intermediate, advanced, mixed)'
          },
          authentication: 'Bearer token required'
        },
        'GET /api/questions/difficulties': {
          description: 'Get available difficulty levels with question counts',
          authentication: 'Bearer token required'
        },
        'POST /api/questions/check': {
          description: 'Check if selected answer is correct',
          body: {
            questionId: 'ID of the question (required)',
            selectedOriginalLetter: 'Original letter of selected answer (required)'
          },
          authentication: 'Bearer token required'
        },
        'GET /api/questions/previous': 'Get previously answered questions (coming soon - bu yeni /api/history/learning ile değişebilir)',
        'GET /api/questions/incorrect': 'Get incorrectly answered questions (coming soon)',
        'GET /api/questions/stats': 'Get user quiz statistics (coming soon - bu /api/users/dashboard-stats ve /api/users/course-stats ile değişecek)'
      },
      users: {
        'POST /api/users/session': {
            description: 'Record a completed quiz session and update user stats.',
            authentication: 'Bearer token required',
            body: {
                course_type: 'String (e.g., general, difficulty-beginner)',
                score_correct: 'Number',
                score_total: 'Number',
                duration_seconds: 'Number (optional)',
                questions_answered_details: 'Array of { question_id, selected_original_letter, is_correct }'
            }
        },
        'GET /api/users/dashboard-stats': {
            description: 'Get user stats for the dashboard (streak, completed today, total points).',
            authentication: 'Bearer token required'
        },
        'GET /api/users/course-stats': {
            description: 'Get user stats for each course (completed count, accuracy).',
            authentication: 'Bearer token required'
        }
      },
      history: { // YENİ: History endpoint bilgisi
        'GET /api/history/learning': {
          description: "Get the authenticated user's learning history with pagination.",
          authentication: 'Bearer token required',
          parameters: {
            page: 'Page number (optional, default: 1)',
            limit: 'Number of items per page (optional, default: 10)',
            sortBy: "Sort order (optional, default: 'date_desc'; options: 'date_asc', 'correctness_desc', 'correctness_asc')"
          }
        }
      }
    },
    features: {
      active: [
        'User authentication with Supabase',
        'Random quiz questions',
        'Difficulty-based question filtering',
        'Answer validation',
        'Question shuffling (backend)', // Ş shuffling backend'de yapıldığı için güncellendi
        'Active question filtering',
        'User session recording',
        'Dashboard statistics',
        'Course-specific statistics'
      ],
      inProgress: [ // YENİ: Geliştirilmekte olan özellikler
        'Learning History'
      ],
      comingSoon: [
        // 'User progress tracking', // Learning History ve Stats bunun bir parçası
        // 'Quiz history', // Learning History ile aynı
        'Incorrect questions practice (Weakness Training)',
        // 'Performance statistics', // Dashboard ve Course Stats ile bir kısmı geldi
        // 'Learning streaks', // Dashboard Stats'ta var
        // 'Difficulty-based progress' // Course Stats ile bir kısmı geldi
        'User Profile Page',
        'Badge System',
        'Leaderboard',
        'Friend System'
      ]
    },
    authentication: 'Bearer token required for most endpoints',
  });
});

module.exports = router;