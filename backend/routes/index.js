const express = require('express');
const router = express.Router();

// Import route modules
const questionsRoutes = require('./questions');
const userRoutes = require('./user'); // Yeni eklenen satır

// API Routes
router.use('/questions', questionsRoutes);
router.use('/users', userRoutes); // Yeni eklenen satır (endpoint'i /api/users/... olacak)

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
            selectedOriginalLetter: 'Original letter of selected answer (required)' // Güncellendi
          },
          authentication: 'Bearer token required'
        },
        'GET /api/questions/previous': 'Get previously answered questions (coming soon)',
        'GET /api/questions/incorrect': 'Get incorrectly answered questions (coming soon)',
        'GET /api/questions/stats': 'Get user quiz statistics (coming soon - bu /api/users/dashboard-stats ve /api/users/course-stats ile değişecek)'
      },
      users: { // Yeni eklendi
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
      }
    },
    features: {
      active: [
        'User authentication with Supabase',
        'Random quiz questions',
        'Difficulty-based question filtering',
        'Answer validation',
        'Question shuffling',
        'Active question filtering'
      ],
      comingSoon: [
        'User progress tracking',
        'Quiz history',
        'Incorrect questions review',
        'Performance statistics',
        'Learning streaks',
        'Difficulty-based progress'
      ]
    },
    authentication: 'Bearer token required for all endpoints',
    // database kısmı artık daha dinamik olduğu için genel bir bilgi verilebilir veya kaldırılabilir.
  });
});

module.exports = router;