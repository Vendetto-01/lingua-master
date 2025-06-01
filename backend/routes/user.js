const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth'); // Auth middleware'i
const { recordQuizSession, getUserDashboardStats, getUserCourseStats } = require('../controllers/userStatsController');

// Quiz oturumunu kaydet
router.post('/session', authenticateUser, recordQuizSession);

// Kullanıcının anasayfa (dashboard) istatistiklerini getir
router.get('/dashboard-stats', authenticateUser, getUserDashboardStats);

// Kullanıcının kurs bazlı istatistiklerini getir
router.get('/course-stats', authenticateUser, getUserCourseStats);

module.exports = router;