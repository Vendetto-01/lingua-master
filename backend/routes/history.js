// backend/routes/history.js
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth'); //
const { getLearningHistory } = require('../controllers/historyController');

// GET /api/history/learning - Get user's learning history
// authenticateUser middleware'i ile korunur
router.get('/learning', authenticateUser, getLearningHistory);

module.exports = router;