'use strict';

const router = require('express').Router();
const ctrl   = require('../../controllers/api/mealPlanner.controller');

router.get('/config',       ctrl.getConfig);
router.put('/config',       ctrl.updateConfig);
router.get('/templates',    ctrl.getTemplates);
router.get('/foods',        ctrl.getFoodsByRole);
router.post('/generate',    ctrl.generateMeal);
router.post('/swap',        ctrl.swapIngredient);

module.exports = router;
