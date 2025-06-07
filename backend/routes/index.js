// backend/routes/index.js (UPDATED for Priority 1)
const express = require('express');
const router = express.Router();

// Import route modules
// const questionsRoutes = require('./questions'); // REMOVED Legacy
const wordsRoutes = require('./words'); // NEW: Words routes
const userRoutes = require('./user');
const historyRoutes = require('./history');

// API Routes
router.use('/words', wordsRoutes); // NEW: Primary words endpoints
// router.use('/questions', questionsRoutes); // REMOVED Legacy
router.use('/users', userRoutes);
router.use('/history', historyRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Lingua Master API',
    version: '2.0.0', // Updated version for words implementation
    database_schema: 'words-based',
    endpoints: {
      words: { // NEW: Primary endpoints
        'GET /api/words/random': {
          description: 'Get random words for quiz with dynamic question generation',
          parameters: {
            limit: 'Number of words (optional, default: 10)',
            difficulty: 'Difficulty level (optional: beginner, intermediate, advanced, mixed)'
          },
          authentication: 'Bearer token required',
          status: 'ACTIVE'
        },
        'GET /api/words/difficulties': {
          description: 'Get available difficulty levels (grouped CEFR levels)',
          authentication: 'Bearer token required',
          status: 'ACTIVE'
        },
        'POST /api/words/check': {
          description: 'Check if selected answer is correct',
          body: {
            questionId: 'ID of the word (required)',
            selectedOriginalLetter: 'Original letter of selected answer (required)'
          },
          authentication: 'Bearer token required',
          status: 'ACTIVE'
        }
      },
      // REMOVED Legacy questions section from API info
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
        'User authentication with Supabase'
      ],
      inProgress: [
        'Learning History with word details (Priority 2)',
        'Enhanced user statistics (Priority 2)'
      ],
      comingSoon: [
        'Weakness training for specific words',
        'Word etymology and advanced definitions',
        'Synonym/antonym challenges',
        'Audio pronunciation',
        'Word frequency analysis'
      ]
    },
    question_format: {
      dynamic_generation: true,
      template: 'In the sentence: "[EXAMPLE_SENTENCE with **WORD** highlighted]" - What does the word "[WORD]" ([PART_OF_SPEECH]) mean?',
      answer_format: 'option_a is always correct, options are shuffled on backend'
    },
    migration_status: {
      database: 'words table active',
      backend: 'words endpoints implemented (Priority 1 complete)',
      frontend: 'compatible with both words and questions endpoints'
    },
    authentication: 'Bearer token required for most endpoints',
  });
});

module.exports = router;