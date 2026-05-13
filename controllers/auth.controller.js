'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User } = require('../models');
const { calculateWaterGoal, calculateAllMetrics } = require('../services/nutrition.service');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tạo JWT và set vào cookie httpOnly.
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

// ─── GET /dang-nhap ───────────────────────────────────────────────────────────

exports.showLogin = (req, res) => {
    res.render('auth/login', {
        title: 'Đăng Nhập',
        error: null,
        success: req.query.registered === '1' ? 'Đăng ký thành công! Vui lòng đăng nhập.' : null,
    });
};

// ─── POST /dang-nhap ──────────────────────────────────────────────────────────

exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.render('auth/login', {
            title: 'Đăng Nhập',
            error: 'Vui lòng nhập đầy đủ email và mật khẩu.',
            success: null,
        });
    }

    try {
        // Tìm user theo email (bao gồm password để so sánh)
        const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });

        if (!user) {
            return res.render('auth/login', {
                title: 'Đăng Nhập',
                error: 'Email hoặc mật khẩu không đúng.',
                success: null,
            });
        }

        // Kiểm tra mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Đăng Nhập',
                error: 'Email hoặc mật khẩu không đúng.',
                success: null,
            });
        }

        // Set JWT cookie
        signTokenAndSetCookie(res, user.id);

        // Nếu chưa onboarding → chuyển sang onboarding
        if (!user.isOnboarded) {
            return res.redirect('/onboarding');
        }

        res.redirect('/dashboard');
    } catch (err) {
        console.error('Login error:', err);
        res.render('auth/login', {
            title: 'Đăng Nhập',
            error: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
            success: null,
        });
    }
};

// ─── GET /dang-ky ─────────────────────────────────────────────────────────────

exports.showRegister = (req, res) => {
    res.render('auth/register', {
        title: 'Đăng Ký',
        error: null,
        formData: {},
    });
};

// ─── POST /dang-ky ────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
    const { fullName, email, password, confirmPassword } = req.body;

    const renderError = (msg) => res.render('auth/register', {
        title: 'Đăng Ký',
        error: msg,
        formData: { fullName, email },
    });

    // Validate
    if (!fullName || !email || !password || !confirmPassword) {
        return renderError('Vui lòng điền đầy đủ thông tin.');
    }
    if (password !== confirmPassword) {
        return renderError('Mật khẩu xác nhận không khớp.');
    }
    if (password.length < 6) {
        return renderError('Mật khẩu phải có ít nhất 6 ký tự.');
    }

    try {
        // Kiểm tra email tồn tại
        const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
        if (existing) {
            return renderError('Email này đã được sử dụng. Vui lòng chọn email khác.');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Tạo user mới
        await User.create({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
        });

        // Redirect sang login với thông báo thành công
        res.redirect('/dang-nhap?registered=1');
    } catch (err) {
        console.error('Register error:', err);

        // Xử lý lỗi validation của Sequelize
        if (err.name === 'SequelizeValidationError') {
            return renderError(err.errors[0].message);
        }
        renderError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
};

// ─── GET /dang-xuat ───────────────────────────────────────────────────────────

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/dang-nhap');
};

// ─── GET /onboarding ──────────────────────────────────────────────────────────

exports.showOnboarding = (req, res) => {
    res.render('auth/onboarding', {
        title: 'Thiết Lập Hồ Sơ',
        user: req.user,
        error: null,
    });
};

// ─── POST /onboarding ─────────────────────────────────────────────────────────

exports.saveOnboarding = async (req, res) => {
    const { gender, birthDate, height, weight, activityLevel, goal } = req.body;

    const renderError = (msg) => res.render('auth/onboarding', {
        title: 'Thiết Lập Hồ Sơ',
        user: req.user,
        error: msg,
    });

    // Validate bắt buộc
    if (!gender || !birthDate || !height || !weight || !activityLevel || !goal) {
        return renderError('Vui lòng điền đầy đủ tất cả thông tin.');
    }

    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
        return renderError('Chiều cao không hợp lệ (50 - 300 cm).');
    }
    if (isNaN(weightNum) || weightNum < 10 || weightNum > 500) {
        return renderError('Cân nặng không hợp lệ (10 - 500 kg).');
    }

    try {
        await req.user.update({
            gender,
            birthDate,
            height    : heightNum,
            weight    : weightNum,
            activityLevel,
            goal,
            isOnboarded: true,
            // Tự động tính mục tiêu nước từ cân nặng (weight × 35ml)
            waterGoal : calculateWaterGoal(weightNum),
        });

        res.redirect('/dashboard');
    } catch (err) {
        console.error('Onboarding error:', err);
        if (err.name === 'SequelizeValidationError') {
            return renderError(err.errors[0].message);
        }
        renderError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
};

// ─── GET /ho-so ───────────────────────────────────────────────────────────────

exports.showProfile = (req, res) => {
    const metrics = calculateAllMetrics(req.user);
    res.render('profile/index', {
        title: 'Hồ Sơ Cá Nhân',
        user: req.user,
        metrics,
        activePage: 'profile',
        error: null,
        success: null,
    });
};

// ─── PUT /ho-so ───────────────────────────────────────────────────────────────

// ─── PUT /ho-so/macros ────────────────────────────────────────────────────────

exports.updateMacros = async (req, res) => {
    try {
        const { macroProtein, macroCarbs, macroFat } = req.body;
        const p = parseInt(macroProtein);
        const c = parseInt(macroCarbs);
        const f = parseInt(macroFat);

        // Validate: tổng phải = 100
        if (isNaN(p) || isNaN(c) || isNaN(f) || p + c + f !== 100) {
            return res.status(400).json({ success: false, message: 'Tổng tỷ lệ Protein + Carbs + Fat phải bằng 100%.' });
        }
        // Validate: từng giá trị hợp lệ (min 5%)
        if ([p, c, f].some(v => v < 5)) {
            return res.status(400).json({ success: false, message: 'Mỗi macro phải tối thiểu 5%.' });
        }
        // Validate: max theo từng loại
        if (p > 70 || f > 70 || c > 80) {
            return res.status(400).json({ success: false, message: 'Protein/Fat tối đa 70%, Carbs tối đa 80%.' });
        }

        await req.user.update({ macroProtein: p, macroCarbs: c, macroFat: f });
        return res.json({ success: true, message: 'Đã cập nhật tỷ lệ Macro thành công!' });
    } catch (err) {
        console.error('Update macros error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server, vui lòng thử lại.' });
    }
};

exports.updateProfile = async (req, res) => {
    const { fullName, gender, birthDate, height, weight, activityLevel, goal } = req.body;

    const renderError = (msg) => res.render('profile/index', {
        title: 'Hồ Sơ Cá Nhân',
        user: req.user,
        activePage: 'profile',
        error: msg,
        success: null,
    });

    if (!fullName) {
        return renderError('Họ tên không được để trống.');
    }

    const heightNum = height ? parseFloat(height) : null;
    const weightNum = weight ? parseFloat(weight) : null;

    if (heightNum !== null && (isNaN(heightNum) || heightNum < 50 || heightNum > 300)) {
        return renderError('Chiều cao không hợp lệ (50 - 300 cm).');
    }
    if (weightNum !== null && (isNaN(weightNum) || weightNum < 10 || weightNum > 500)) {
        return renderError('Cân nặng không hợp lệ (10 - 500 kg).');
    }

    // Cảnh báo nếu user xóa các field cần thiết để tính BMR (không chặn, nhưng cảnh báo)
    const warningFields = [];
    if (!gender)    warningFields.push('giới tính');
    if (!birthDate) warningFields.push('ngày sinh');
    if (!heightNum) warningFields.push('chiều cao');
    if (!weightNum) warningFields.push('cân nặng');

    try {
        await req.user.update({
            fullName      : fullName.trim(),
            gender        : gender || null,
            birthDate     : birthDate || null,
            height        : heightNum,
            weight        : weightNum,
            activityLevel : activityLevel || null,
            goal          : goal || null,
            // Nếu user cập nhật cân nặng mới → tính lại waterGoal tự động
            // User có thể ghi đè bất cứ lúc nào qua PUT /nuoc/muc-tieu
            ...(weightNum ? { waterGoal: calculateWaterGoal(weightNum) } : {}),
        });

        // Tạo message: nếu có field bị bỏ trống, thêm warning
        const successMsg = warningFields.length > 0
            ? `Cập nhật thành công! ⚠️ Thiếu ${warningFields.join(', ')} — chỉ số BMR/TDEE sẽ không tính được.`
            : 'Cập nhật hồ sơ thành công!';

        res.render('profile/index', {
            title: 'Hồ Sơ Cá Nhân',
            user: req.user,
            activePage: 'profile',
            error: null,
            success: successMsg,
        });
    } catch (err) {
        console.error('Update profile error:', err);
        if (err.name === 'SequelizeValidationError') {
            return renderError(err.errors[0].message);
        }
        renderError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
};
