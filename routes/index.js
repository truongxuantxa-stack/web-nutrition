'use strict';

const express = require('express');
const router  = express.Router();
const { requireAuth, requireOnboarded, optionalAuth } = require('../middlewares/auth.middleware');

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

// ─── Phase 4: Diary, Weight & Exercise routes (cần đăng nhập + onboarded) ────
const diaryRoutes    = require('./diary.routes');
const weightRoutes   = require('./weight.routes');
const exerciseRoutes = require('./exercise.routes');
router.use('/', requireAuth, requireOnboarded, diaryRoutes);
router.use('/', requireAuth, requireOnboarded, weightRoutes);
router.use('/', requireAuth, requireOnboarded, exerciseRoutes);

module.exports = router;
