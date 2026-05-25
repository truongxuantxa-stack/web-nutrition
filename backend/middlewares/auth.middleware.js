'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware bắt buộc đăng nhập.
 * Đọc JWT từ cookie 'token', verify, load user từ DB, gán vào req.user.
 * Nếu không hợp lệ → redirect về /dang-nhap.
 */
const requireAuth = async (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.redirect('/dang-nhap');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Lấy user mới nhất từ DB (tránh dùng dữ liệu cũ trong token)
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            res.clearCookie('token');
            return res.redirect('/dang-nhap');
        }

        req.user = user;
        res.locals.user = user; // Để dùng trong EJS templates
        next();
    } catch (err) {
        // Token hết hạn hoặc không hợp lệ
        res.clearCookie('token');
        return res.redirect('/dang-nhap');
    }
};

/**
 * Middleware kiểm tra đã hoàn thành onboarding.
 * Phải dùng SAU requireAuth.
 * Nếu chưa onboard → redirect về /onboarding.
 */
const requireOnboarded = (req, res, next) => {
    if (!req.user.isOnboarded) {
        return res.redirect('/onboarding');
    }
    next();
};

/**
 * Middleware cho trang Onboarding.
 * Phải dùng SAU requireAuth.
 * Nếu user ĐÃ onboard rồi → redirect về /dashboard (không cần làm lại).
 */
const redirectIfOnboarded = (req, res, next) => {
    if (req.user.isOnboarded) {
        const redirectUrl = process.env.NODE_ENV === 'production'
            ? '/dashboard'
            : `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`;
        return res.redirect(redirectUrl);
    }
    next();
};

/**
 * Middleware cho trang guest (login/register).
 * Nếu đã đăng nhập → redirect về /dashboard.
 */
const redirectIfAuthenticated = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) return next();

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        const redirectUrl = process.env.NODE_ENV === 'production'
            ? '/dashboard'
            : `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`;
        return res.redirect(redirectUrl);
    } catch {
        res.clearCookie('token');
        next();
    }
};

/**
 * Helper: Inject user vào res.locals nếu có token hợp lệ (optional auth).
 * Dùng cho các route public nhưng vẫn muốn hiển thị navbar user.
 */
const optionalAuth = async (req, res, next) => {
    const token = req.cookies?.token;
    res.locals.user = null;

    if (!token) return next();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] },
        });
        if (user) {
            req.user = user;
            res.locals.user = user;
        }
    } catch {
        res.clearCookie('token');
    }

    next();
};

/**
 * Middleware auth cho API routes (/api/v1/*).
 * Đọc Access Token từ Authorization header (Bearer <token>).
 * Trả JSON 401 thay vì redirect — tương thích với React SPA.
 */
const requireAuthApi = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.error('Chưa đăng nhập.', 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            return res.error('User không tồn tại.', 401);
        }

        req.user = user;
        next();
    } catch (err) {
        // Phân biệt token hết hạn vs token sai hoàn toàn (để Frontend biết trigger refresh)
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn.',
                code: 'TOKEN_EXPIRED',
            });
        }
        return res.error('Token không hợp lệ.', 401);
    }
};

module.exports = {
    requireAuth,
    requireOnboarded,
    redirectIfOnboarded,
    redirectIfAuthenticated,
    optionalAuth,
    requireAuthApi,
};
