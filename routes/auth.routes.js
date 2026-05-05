'use strict';

const express = require('express');
const router  = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth, requireOnboarded, redirectIfOnboarded, redirectIfAuthenticated } = require('../middlewares/auth.middleware');

// ─── Guest routes (chỉ dành cho chưa đăng nhập) ──────────────────────────────

// GET /dang-nhap
router.get('/dang-nhap', redirectIfAuthenticated, authController.showLogin);

// POST /dang-nhap
router.post('/dang-nhap', redirectIfAuthenticated, authController.login);

// GET /dang-ky
router.get('/dang-ky', redirectIfAuthenticated, authController.showRegister);

// POST /dang-ky
router.post('/dang-ky', redirectIfAuthenticated, authController.register);

// ─── Logout ───────────────────────────────────────────────────────────────────

// GET /dang-xuat
router.get('/dang-xuat', authController.logout);

// ─── Onboarding (cần auth, chưa được onboarded) ──────────────────────────────

// GET /onboarding
router.get('/onboarding', requireAuth, redirectIfOnboarded, authController.showOnboarding);

// POST /onboarding
router.post('/onboarding', requireAuth, redirectIfOnboarded, authController.saveOnboarding);

// ─── Profile (cần auth + onboarded) ──────────────────────────────────────────

// GET /ho-so
router.get('/ho-so', requireAuth, requireOnboarded, authController.showProfile);

// POST /ho-so (dùng POST vì form HTML không hỗ trợ PUT)
router.post('/ho-so', requireAuth, requireOnboarded, authController.updateProfile);

module.exports = router;
