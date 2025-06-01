const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getRandomQuestions, getDifficultyLevels, checkAnswer } = require('../controllers/questionsController');

// GET /api/questions/random - Get random questions for general quiz or by difficulty
// Protected route - requires authentication
// Query parameters: 
//   - limit (optional): Number of questions (default: 10)
//   - difficulty (optional): Difficulty level (beginner, intermediate, advanced, mixed)
router.get('/random', authenticateUser, getRandomQuestions);

// GET /api/questions/difficulties - Get available difficulty levels with question counts
// Protected route - requires authentication
router.get('/difficulties', authenticateUser, getDifficultyLevels);

// POST /api/questions/check - Check if selected answer is correct
// Protected route - requires authentication
router.post('/check', authenticateUser, checkAnswer);

// Placeholder routes for future features
// GET /api/questions/previous - Get user's previously answered questions
router.get('/previous', authenticateUser, (req, res) => {
  res.json({
    success: false,
    message: 'Previous questions feature coming soon!',
    placeholder: true,
    requiredTables: ['user_profiles', 'quiz_sessions', 'user_question_answers']
  });
});

// GET /api/questions/incorrect - Get user's incorrectly answered questions
router.get('/incorrect', authenticateUser, (req, res) => {
  res.json({
    success: false,
    message: 'Incorrect questions review feature coming soon!',
    placeholder: true,
    requiredTables: ['user_profiles', 'user_question_answers']
  });
});

// GET /api/questions/stats - Get user's quiz statistics (future feature)
router.get('/stats', authenticateUser, (req, res) => {
  res.json({
    success: false,
    message: 'User statistics feature coming soon!',
    placeholder: true,
    requiredTables: ['user_profiles', 'quiz_sessions'],
    plannedFeatures: [
      'Total questions answered',
      'Accuracy rate by difficulty',
      'Learning streak',
      'Progress over time',
      'Favorite difficulty level'
    ]
  });
});

module.exports = router;