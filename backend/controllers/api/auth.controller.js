'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tạo Access Token (15 phút) — trả qua JSON body.
 */
const signAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Tạo Refresh Token (7 ngày) — set vào HttpOnly Cookie.
 */
const signRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Set Refresh Token vào HttpOnly Cookie.
 * path='/api/v1/auth/refresh-token' → cookie chỉ gửi đúng route refresh (bảo mật hơn).
 */
const setRefreshTokenCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày (ms)
        path: '/api/v1/auth/refresh-token',
    });
};

/**
 * Set token (EJS JWT cookie) vào cookie.
 */
const signTokenAndSetCookie = (res, userId) => {
    const token = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày (ms)
    });
};

// ─── POST /api/v1/auth/login ─────────────────────────────────────────────────

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm user (bao gồm password để so sánh)
        const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
        if (!user) {
            return res.error('Email hoặc mật khẩu không đúng.', 401);
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.error('Email hoặc mật khẩu không đúng.', 401);
        }

        // Tạo tokens
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        // Set Refresh Token vào cookie
        setRefreshTokenCookie(res, refreshToken);

        // Set EJS Session Token vào cookie
        signTokenAndSetCookie(res, user.id);

        return res.success(
            {
                user: {
                    id: user.id,
                    name: user.fullName,
                    email: user.email,
                    isOnboarded: user.isOnboarded,
                },
                accessToken,
            },
            'Đăng nhập thành công.'
        );
    } catch (err) {
        console.error('[API] Login error:', err);
        return res.error('Lỗi máy chủ. Vui lòng thử lại.', 500);
    }
};

// ─── POST /api/v1/auth/register ─────────────────────────────────────────────

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Kiểm tra email tồn tại
        const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
        if (existing) {
            return res.error('Email này đã được sử dụng.', 409);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Tạo user
        const user = await User.create({
            fullName: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
        });

        // Tạo tokens ngay sau khi đăng ký (auto-login)
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        setRefreshTokenCookie(res, refreshToken);

        // Set EJS Session Token vào cookie
        signTokenAndSetCookie(res, user.id);

        return res.status(201).json({
            success: true,
            message: 'Đăng ký thành công.',
            data: {
                user: {
                    id: user.id,
                    name: user.fullName,
                    email: user.email,
                    isOnboarded: user.isOnboarded,
                },
                accessToken,
            },
        });
    } catch (err) {
        console.error('[API] Register error:', err);
        if (err.name === 'SequelizeValidationError') {
            return res.error(err.errors[0].message, 422);
        }
        return res.error('Lỗi máy chủ. Vui lòng thử lại.', 500);
    }
};

// ─── POST /api/v1/auth/logout ────────────────────────────────────────────────

exports.logout = (req, res) => {
    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh-token' });
    res.clearCookie('token');
    return res.success(null, 'Đăng xuất thành công.');
};

// ─── POST /api/v1/auth/refresh-token ────────────────────────────────────────

exports.refreshToken = (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.error('Không có refresh token.', 401);
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const newAccessToken = signAccessToken(decoded.id);

        return res.success({ accessToken: newAccessToken }, 'Token đã được làm mới.');
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.error('Refresh token đã hết hạn. Vui lòng đăng nhập lại.', 401);
        }
        return res.error('Refresh token không hợp lệ.', 401);
    }
};

// ─── GET /api/v1/auth/me ─────────────────────────────────────────────────────

exports.getMe = (req, res) => {
    // req.user đã được gắn bởi requireAuthApi middleware
    const { id, fullName, email, isOnboarded, gender, birthDate, height, weight, activityLevel, goal } = req.user;
    return res.success({
        user: { id, name: fullName, email, isOnboarded, gender, birthDate, height, weight, activityLevel, goal },
    });
};
