'use strict';

const { body, validationResult } = require('express-validator');

/**
 * Chạy sau tất cả validation rules, kiểm tra lỗi và trả về nếu có.
 */
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.validationError(
            errors.array().map(e => ({ field: e.path, msg: e.msg }))
        );
    }
    next();
};

/**
 * Validate input cho POST /api/v1/auth/login
 */
const login = [
    body('email')
        .isEmail().withMessage('Email không đúng định dạng.'),
    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống.'),
    handleValidation,
];

/**
 * Validate input cho POST /api/v1/auth/register
 */
const register = [
    body('name')
        .trim()
        .notEmpty().withMessage('Tên không được để trống.'),
    body('email')
        .isEmail().withMessage('Email không đúng định dạng.'),
    body('password')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự.'),
    handleValidation,
];

module.exports = { login, register };
