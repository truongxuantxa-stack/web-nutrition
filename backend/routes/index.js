'use strict';

const express = require('express');
const router  = express.Router();
const { requireAuth, requireOnboarded, optionalAuth } = require('../middlewares/auth.middleware');

// Không xử lý các request thuộc namespace /api/v1/ — đã được xử lý ở app.js
router.use('/api/v1', (req, res) => {
    // Nếu request đến đây nghĩa là /api/v1 router không match → 404 JSON
    return res.error('Endpoint không tồn tại.', 404);
});

// ─── Trang chủ: redirect ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.redirect('/dang-nhap');
});

// ─── Auth Routes ─────────────────────────────────────────────────────────────
const authRoutes = require('./auth.routes');
router.use('/', authRoutes);

// ─── Dashboard (cần đăng nhập + onboarded) ───────────────────────────────────
const dashboardController = require('../controllers/dashboard.controller');
router.get('/dashboard', requireAuth, requireOnboarded, dashboardController.getDashboard);

// ─── Phase 4: Diary, Weight, Exercise & Water routes (cần đăng nhập + onboarded) ─
const diaryRoutes    = require('./diary.routes');
const weightRoutes   = require('./weight.routes');
const exerciseRoutes = require('./exercise.routes');
const waterRoutes    = require('./water.routes');
const mealPlannerRoutes = require('./mealPlanner.routes');

router.use('/', requireAuth, requireOnboarded, diaryRoutes);
router.use('/', requireAuth, requireOnboarded, weightRoutes);
router.use('/', requireAuth, requireOnboarded, exerciseRoutes);
router.use('/', requireAuth, requireOnboarded, waterRoutes);

const mealPlannerController = require('../controllers/mealPlanner.controller');
router.get('/lap-ke-hoach', requireAuth, requireOnboarded, mealPlannerController.renderMealPlannerPage);
router.use('/api/meal-planner', requireAuth, requireOnboarded, mealPlannerRoutes);

// ─── Adaptive TDEE ───────────────────────────────────────────────────────────
const adaptiveTDEERoutes = require('./adaptiveTDEE.routes');
router.use('/api/adaptive-tdee', requireAuth, requireOnboarded, adaptiveTDEERoutes);

// ─── Report (Xuất báo cáo PDF) ───────────────────────────────────────────────
const reportRoutes = require('./report.routes');
router.use('/api/report', requireAuth, requireOnboarded, reportRoutes);

module.exports = router;
