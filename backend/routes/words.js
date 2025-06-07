// backend/routes/words.js
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { getRandomWords, getDifficultyLevels, checkAnswer, deleteWord } = require('../controllers/wordsController'); // Added deleteWord

// GET /api/words/random - Get random words for quiz
// Protected route - requires authentication
// Query parameters: 
//   - limit (optional): Number of words (default: 10)
//   - difficulty (optional): Difficulty level (beginner, intermediate, advanced, mixed)
router.get('/random', authenticateUser, getRandomWords);

// GET /api/words/difficulties - Get available difficulty levels with word counts
// Protected route - requires authentication
router.get('/difficulties', authenticateUser, getDifficultyLevels);

// POST /api/words/check - Check if selected answer is correct
// Protected route - requires authentication
// Body: { questionId: number, selectedOriginalLetter: 'A'|'B'|'C'|'D' }
router.post('/check', authenticateUser, checkAnswer);

// DELETE /api/words/:wordId - Delete a word (question)
// Protected route - requires authentication
router.delete('/:wordId', authenticateUser, deleteWord);

module.exports = router;