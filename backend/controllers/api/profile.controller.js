'use strict';

const { User, Food } = require('../../models');
const { calculateAllMetrics, calculateWaterGoal } = require('../../services/nutrition.service');

// GET /api/v1/profile
exports.getProfile = async (req, res) => {
    try {
        const metrics = calculateAllMetrics(req.user);
        const { id, fullName, email, gender, birthDate, height, weight, activityLevel, goal, isOnboarded, macroProtein, macroCarbs, macroFat, contributionCount } = req.user;
        return res.success({
            user: { id, name: fullName, email, gender, birthDate, height, weight, activityLevel, goal, isOnboarded, macroProtein, macroCarbs, macroFat, contributionCount },
            metrics
        });
    } catch (err) {
        console.error('[API] getProfile error:', err);
        return res.error('Lỗi server khi lấy thông tin hồ sơ.', 500);
    }
};

// PUT /api/v1/profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, gender, birthDate, height, weight, activityLevel, goal } = req.body;
        if (!name) {
            return res.error('Họ tên không được để trống.', 400);
        }

        const heightNum = height ? parseFloat(height) : null;
        const weightNum = weight ? parseFloat(weight) : null;

        if (heightNum !== null && (isNaN(heightNum) || heightNum < 50 || heightNum > 300)) {
            return res.error('Chiều cao không hợp lệ (50 - 300 cm).', 400);
        }
        if (weightNum !== null && (isNaN(weightNum) || weightNum < 10 || weightNum > 500)) {
            return res.error('Cân nặng không hợp lệ (10 - 500 kg).', 400);
        }

        const updates = {
            fullName: name.trim(),
            gender: gender || null,
            birthDate: birthDate || null,
            height: heightNum,
            weight: weightNum,
            activityLevel: activityLevel || null,
            goal: goal || null,
        };

        if (weightNum) {
            updates.waterGoal = calculateWaterGoal(weightNum);
        }

        await req.user.update(updates);

        return res.success(null, 'Cập nhật thông tin hồ sơ thành công!');
    } catch (err) {
        console.error('[API] updateProfile error:', err);
        if (err.name === 'SequelizeValidationError') {
            return res.error(err.errors[0].message, 400);
        }
        return res.error('Lỗi server khi cập nhật hồ sơ.', 500);
    }
};

// PUT /api/v1/profile/macros
exports.updateMacros = async (req, res) => {
    try {
        const { macroProtein, macroCarbs, macroFat } = req.body;
        const p = parseInt(macroProtein);
        const c = parseInt(macroCarbs);
        const f = parseInt(macroFat);

        if (isNaN(p) || isNaN(c) || isNaN(f) || p + c + f !== 100) {
            return res.error('Tổng tỷ lệ Protein + Carbs + Fat phải bằng 100%.', 400);
        }
        if ([p, c, f].some(v => v < 5)) {
            return res.error('Mỗi chỉ số dinh dưỡng tối thiểu phải đạt 5%.', 400);
        }
        if (p > 70 || f > 70 || c > 80) {
            return res.error('Protein/Fat tối đa 70%, Carbs tối đa 80%.', 400);
        }

        await req.user.update({ macroProtein: p, macroCarbs: c, macroFat: f });
        return res.success(null, 'Cập nhật tỷ lệ Macro thành công!');
    } catch (err) {
        console.error('[API] updateMacros error:', err);
        return res.error('Lỗi server khi cập nhật tỷ lệ dinh dưỡng.', 500);
    }
};

// GET /api/v1/profile/allergies
exports.getAllergies = async (req, res) => {
    try {
        const allergyIds = req.user.allergies || [];
        if (allergyIds.length === 0) {
            return res.success({ allergies: [] });
        }
        const foods = await Food.findAll({
            where: { id: allergyIds },
            attributes: ['id', 'name', 'category']
        });
        return res.success({ allergies: foods });
    } catch (err) {
        console.error('[API] getAllergies error:', err);
        return res.error('Lỗi server khi lấy danh sách dị ứng.', 500);
    }
};

// PUT /api/v1/profile/allergies
exports.updateAllergies = async (req, res) => {
    try {
        const { foodIds } = req.body;
        await req.user.update({ allergies: foodIds || [] });
        return res.success(null, 'Đã cập nhật danh sách thực phẩm dị ứng.');
    } catch (err) {
        console.error('[API] updateAllergies error:', err);
        return res.error('Lỗi server khi cập nhật dị ứng.', 500);
    }
};

// POST /api/v1/profile/onboarding
exports.onboardUser = async (req, res) => {
    try {
        const { gender, birthDate, height, weight, activityLevel, goal } = req.body;
        if (!gender || !birthDate || !height || !weight || !activityLevel || !goal) {
            return res.error('Vui lòng điền đầy đủ tất cả thông tin.', 400);
        }

        const heightNum = parseFloat(height);
        const weightNum = parseFloat(weight);

        if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
            return res.error('Chiều cao không hợp lệ (50 - 300 cm).', 400);
        }
        if (isNaN(weightNum) || weightNum < 10 || weightNum > 500) {
            return res.error('Cân nặng không hợp lệ (10 - 500 kg).', 400);
        }

        await req.user.update({
            gender,
            birthDate,
            height: heightNum,
            weight: weightNum,
            activityLevel,
            goal,
            isOnboarded: true,
            waterGoal: calculateWaterGoal(weightNum)
        });

        return res.success({
            user: {
                id: req.user.id,
                name: req.user.fullName,
                email: req.user.email,
                isOnboarded: true
            }
        }, 'Thiết lập hồ sơ thành công!');
    } catch (err) {
        console.error('[API] onboardUser error:', err);
        if (err.name === 'SequelizeValidationError') {
            return res.error(err.errors[0].message, 400);
        }
        return res.error('Lỗi server khi thiết lập hồ sơ.', 500);
    }
};
