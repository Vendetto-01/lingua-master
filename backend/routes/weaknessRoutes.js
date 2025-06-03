// backend/routes/weaknessRoutes.js
const express = require('express');
const router = express.Router();
const weaknessController = require('../controllers/weaknessController');
const { authenticateUser } = require('../middleware/auth'); // Kullanıcı kimlik doğrulaması için

// Tüm weakness routes için kimlik doğrulama middleware'ini başta kullanabiliriz
router.use(authenticateUser);

// POST /api/weakness/items - Bir kelimeyi kullanıcının zayıflık listesine ekler/günceller
router.post('/items', weaknessController.addOrUpdateWeaknessItem);

// DELETE /api/weakness/items/:word_id - Bir kelimeyi kullanıcının zayıflık listesinden çıkarır
router.delete('/items/:word_id', weaknessController.removeWeaknessItem);

// GET /api/weakness/questions - Kullanıcının zayıflık antrenmanı için soruları getirir
router.get('/questions', weaknessController.getWeaknessTrainingQuestions);

// GET /api/weakness/items/count - Kullanıcının zayıflık listesindeki aktif kelime sayısını getirir
router.get('/items/count', weaknessController.getWeaknessItemsCount);

module.exports = router;