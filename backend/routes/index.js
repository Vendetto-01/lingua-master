const express = require('express');
const router = express.Router();

// Import route modules
const questionsRoutes = require('./questions');

// API Routes
router.use('/questions', questionsRoutes);

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
            selectedIndex: 'Index of selected answer (required)'
          },
          authentication: 'Bearer token required'
        },
        'GET /api/questions/previous': 'Get previously answered questions (coming soon)',
        'GET /api/questions/incorrect': 'Get incorrectly answered questions (coming soon)',
        'GET /api/questions/stats': 'Get user quiz statistics (coming soon)'
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
    database: {
      questions: {
        fields: ['id', 'word_id', 'paragraph', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'difficulty', 'is_active'],
        filters: ['difficulty', 'is_active']
      }
    }
  });
});

module.exports = router;