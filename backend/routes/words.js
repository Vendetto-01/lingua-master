// backend/routes/words.js (NEW FILE)
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getRandomWords, getDifficultyLevels, checkAnswer } = require('../controllers/wordsController');

// GET /api/words/random - Get random words for quiz
router.get('/random', authenticateUser, getRandomWords);

// GET /api/words/difficulties - Get available difficulty levels
router.get('/difficulties', authenticateUser, getDifficultyLevels);

// POST /api/words/check - Check if selected answer is correct
router.post('/check', authenticateUser, checkAnswer);

module.exports = router;

// backend/routes/index.js (UPDATED)
const express = require('express');
const router = express.Router();

// Import route modules
const wordsRoutes = require('./words'); // NEW: Words routes instead of questions
const userRoutes = require('./user');
const historyRoutes = require('./history');

// API Routes
router.use('/words', wordsRoutes); // NEW: Use words routes
router.use('/questions', wordsRoutes); // LEGACY: Keep questions routes for backward compatibility
router.use('/users', userRoutes);
router.use('/history', historyRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Lingua Master API',
    version: '2.0.0', // Updated version
    database_schema: 'words-based', // NEW: Indicate new schema
    endpoints: {
      words: { // NEW: Words endpoints
        'GET /api/words/random': {
          description: 'Get random words for quiz with dynamic question generation',
          parameters: {
            limit: 'Number of words (optional, default: 10)',
            difficulty: 'Difficulty level (optional: beginner, intermediate, advanced, mixed)'
          },
          authentication: 'Bearer token required'
        },
        'GET /api/words/difficulties': {
          description: 'Get available difficulty levels (grouped CEFR levels)',
          authentication: 'Bearer token required'
        },
        'POST /api/words/check': {
          description: 'Check if selected answer is correct',
          body: {
            questionId: 'ID of the word (required)',
            selectedOriginalLetter: 'Original letter of selected answer (required)'
          },
          authentication: 'Bearer token required'
        }
      },
      questions: { // LEGACY: Redirects to words endpoints
        'GET /api/questions/random': 'Redirects to /api/words/random',
        'GET /api/questions/difficulties': 'Redirects to /api/words/difficulties', 
        'POST /api/questions/check': 'Redirects to /api/words/check',
        'GET /api/questions/previous': 'Deprecated - use /api/history/learning',
        'GET /api/questions/incorrect': 'Coming soon - weakness training',
        'GET /api/questions/stats': 'Deprecated - use /api/users/dashboard-stats and /api/users/course-stats'
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
                questions_answered_details: 'Array of { question_id (word_id), selected_original_letter, is_correct }'
            }
        },
        'GET /api/users/dashboard-stats': {
            description: 'Get user stats for dashboard (streak, completed today, total points).',
            authentication: 'Bearer token required'
        },
        'GET /api/users/course-stats': {
            description: 'Get user stats for each course (completed count, accuracy).',
            authentication: 'Bearer token required'
        }
      },
      history: {
        'GET /api/history/learning': {
          description: "Get the authenticated user's learning history with pagination.",
          authentication: 'Bearer token required',
          parameters: {
            page: 'Page number (optional, default: 1)',
            limit: 'Number of items per page (optional, default: 10)',
            sortBy: "Sort order (optional, default: 'date_desc')"
          }
        }
      }
    },
    features: {
      active: [
        'Dynamic question generation from words',
        'CEFR-based difficulty levels (A1-C2)',
        'Word-focused vocabulary learning',
        'Context-based questions with example sentences',
        'Enhanced explanations with word definitions',
        'User authentication with Supabase',
        'Backward compatibility with questions endpoints'
      ],
      inProgress: [
        'Learning History with word details',
        'Weakness training for specific words'
      ],
      comingSoon: [
        'Word etymology and advanced definitions',
        'Synonym/antonym challenges', 
        'Word usage in different contexts',
        'Audio pronunciation',
        'Word frequency analysis'
      ]
    },
    question_format: {
      dynamic_generation: true,
      template: 'In the sentence: "[EXAMPLE_SENTENCE with **WORD** highlighted]" - What does the word "[WORD]" ([PART_OF_SPEECH]) mean?',
      answer_format: 'option_a is always correct, options are shuffled on backend'
    },
    authentication: 'Bearer token required for most endpoints',
  });
});

module.exports = router;