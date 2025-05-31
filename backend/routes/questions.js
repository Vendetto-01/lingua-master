const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getRandomQuestions, checkAnswer } = require('../controllers/questionsController');

// GET /api/questions/random - Get random questions for general quiz
// Protected route - requires authentication
router.get('/random', authenticateUser, getRandomQuestions);

// POST /api/questions/check - Check if selected answer is correct
// Protected route - requires authentication
router.post('/check', authenticateUser, checkAnswer);

// Placeholder routes for future features
// GET /api/questions/previous - Get user's previously answered questions
router.get('/previous', authenticateUser, (req, res) => {
  res.json({
    success: false,
    message: 'Previous questions feature coming soon!',
    placeholder: true
  });
});

// GET /api/questions/incorrect - Get user's incorrectly answered questions
router.get('/incorrect', authenticateUser, (req, res) => {
  res.json({
    success: false,
    message: 'Incorrect questions review feature coming soon!',
    placeholder: true
  });
});

module.exports = router;