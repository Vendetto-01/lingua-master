// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth'); // Kullanıcı kimlik doğrulaması için

// POST /api/reports/question - Yeni bir soru raporu gönder
// authMiddleware.authenticate opsiyonel olarak eklenebilir, eğer raporların sadece giriş yapmış kullanıcılar tarafından gönderilmesi isteniyorsa.
// Şimdilik anonim raporlara izin verecek şekilde bırakıyorum, ancak gerekirse authMiddleware.authenticate eklenebilir.
// router.post('/question', authMiddleware.authenticate, reportController.submitQuestionReport);
router.post('/question', reportController.submitQuestionReport);


// Gelecekte eklenebilecek diğer rapor endpoint'leri (örneğin, raporları listeleme - admin için)
// router.get('/', authMiddleware.authenticate, authMiddleware.authorizeAdmin, reportController.getAllReports);
// router.get('/:reportId', authMiddleware.authenticate, authMiddleware.authorizeAdmin, reportController.getReportById);
// router.put('/:reportId/status', authMiddleware.authenticate, authMiddleware.authorizeAdmin, reportController.updateReportStatus);

module.exports = router;