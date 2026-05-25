'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/api/mealPlanner.controller.js
// Forward tất cả sang mealPlanner.controller.js — đã trả JSON sẵn
// ═══════════════════════════════════════════════════════════════════════════════

const ejsMealCtrl = require('../mealPlanner.controller');

exports.getConfig       = ejsMealCtrl.getConfig;
exports.updateConfig    = ejsMealCtrl.updateConfig;
exports.getTemplates    = ejsMealCtrl.getTemplates;
exports.generateMeal    = ejsMealCtrl.generateMeal;
exports.swapIngredient  = ejsMealCtrl.swapIngredient;
exports.getFoodsByRole  = ejsMealCtrl.getFoodsByRole;
