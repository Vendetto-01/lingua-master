// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateUser } = require('../middleware/auth'); // Kullanıcı kimlik doğrulaması için

// POST /api/reports/question - Yeni bir soru raporu gönder
// Bu endpoint'in de kimlik doğrulaması gerektirip gerektirmediğine karar verilmeli.
// Eğer raporu gönderen kullanıcıyı kaydetmek istiyorsak (reportController'da user_id alanı var), authenticateUser eklenmeli.
// Şimdilik reportController.submitQuestionReport içinde req.user kontrolü var, o yüzden buraya da ekleyelim.
router.post('/question', authenticateUser, reportController.submitQuestionReport);

// GET /api/reports/user-questions - Mevcut kullanıcının raporladığı (ve gizlemediği) soruları getirir
router.get('/user-questions', authenticateUser, reportController.getUserReportedQuestions);

// POST /api/reports/:report_id/dismiss - Bir raporu mevcut kullanıcı için "gizlendi" olarak işaretler
router.post('/:report_id/dismiss', authenticateUser, reportController.dismissReportForUser);


// Gelecekte eklenebilecek diğer rapor endpoint'leri (örneğin, raporları listeleme - admin için)
// router.get('/', authenticateUser, authMiddleware.authorizeAdmin, reportController.getAllReports);
// router.get('/:report_id', authenticateUser, authMiddleware.authorizeAdmin, reportController.getReportById);
// router.put('/:report_id/status', authenticateUser, authMiddleware.authorizeAdmin, reportController.updateReportStatus);

module.exports = router;