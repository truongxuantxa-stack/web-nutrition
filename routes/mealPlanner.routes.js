'use strict';

const express = require('express');
const router = express.Router();
const mealPlannerController = require('../controllers/mealPlanner.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Mọi tính năng liên quan đến lập kế hoạch bữa ăn đều yêu cầu đăng nhập
router.use(requireAuth);

router.get('/config', mealPlannerController.getConfig);
router.put('/config', mealPlannerController.updateConfig);
router.get('/templates', mealPlannerController.getTemplates);
router.post('/generate', mealPlannerController.generateMeal);
router.post('/swap', mealPlannerController.swapIngredient);

module.exports = router;
