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
        'GET /api/questions/random': 'Get random questions for general quiz',
        'POST /api/questions/check': 'Check if selected answer is correct',
        'GET /api/questions/previous': 'Get previously answered questions (coming soon)',
        'GET /api/questions/incorrect': 'Get incorrectly answered questions (coming soon)'
      }
    },
    authentication: 'Bearer token required for all endpoints'
  });
});

module.exports = router;