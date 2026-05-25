'use strict';

const router = require('express').Router();
const { requireAuthApi } = require('../../middlewares/auth.middleware');

// Auth routes: /api/v1/auth/*
router.use('/auth', require('./auth.routes'));

// Bước 4 — React SPA core pages
router.use('/dashboard',   requireAuthApi, require('./dashboard.routes'));
router.use('/diary',       requireAuthApi, require('./diary.routes'));
router.use('/weight',      requireAuthApi, require('./weight.routes'));
router.use('/water',       requireAuthApi, require('./water.routes'));
router.use('/exercise',    requireAuthApi, require('./exercise.routes'));
router.use('/meal-planner', requireAuthApi, require('./mealPlanner.routes'));
router.use('/profile',      requireAuthApi, require('./profile.routes'));
router.use('/report',        requireAuthApi, require('./report.routes'));
router.use('/adaptive-tdee', requireAuthApi, require('./adaptiveTDEE.routes'));

module.exports = router;
