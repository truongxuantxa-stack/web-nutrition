const express = require('express');
const router = express.Router();
const adaptiveController = require('../controllers/adaptiveTDEE.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Áp dụng middleware requireAuth cho tất cả các route trong file này
router.use(requireAuth);

router.get('/status', adaptiveController.getStatus);
router.post('/calculate', adaptiveController.calculateNow);
router.put('/toggle', adaptiveController.toggle);
router.get('/history', adaptiveController.getHistory);
router.put('/skip-week', adaptiveController.skipWeek);

module.exports = router;
