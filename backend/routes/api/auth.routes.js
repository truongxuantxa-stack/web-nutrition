'use strict';

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { requireAuthApi } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validators/auth.validator');
const authApiCtrl = require('../../controllers/api/auth.controller');

// Rate limiter cho các route đăng nhập/đăng ký (chống brute-force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Quá nhiều request. Vui lòng thử lại sau 15 phút.' },
});

// POST /api/v1/auth/login
router.post('/login', authLimiter, validate.login, authApiCtrl.login);

// POST /api/v1/auth/register
router.post('/register', authLimiter, validate.register, authApiCtrl.register);

// POST /api/v1/auth/logout
router.post('/logout', authApiCtrl.logout);

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', authApiCtrl.refreshToken);

// GET /api/v1/auth/me — cần Access Token hợp lệ
router.get('/me', requireAuthApi, authApiCtrl.getMe);

module.exports = router;
