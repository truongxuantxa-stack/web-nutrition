'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/api/mealPlanner.controller.js
// Lớp mỏng: nhận request → gọi mealPlanner.service + nutrition.service → trả JSON.
// Logic được gộp trực tiếp từ controllers/mealPlanner.controller.js (legacy).
// ═══════════════════════════════════════════════════════════════════════════════

const { User, UserMealConfig, MealTemplate, Food } = require('../../models');
const mealPlannerService = require('../../services/mealPlanner.service');
const nutritionService   = require('../../services/nutrition.service');

// ─── Helper nội bộ: tính meal target cho user ─────────────────────────────────
const getMealTarget = async (userId, mealKey) => {
    const user = await User.findByPk(userId);
    if (!user || !user.weight || !user.height) {
        throw new Error('Bạn cần cập nhật đủ thông tin chỉ số cơ thể trước.');
    }

    const metrics = nutritionService.calculateAllMetrics(user);
    if (!metrics || !metrics.targetCalories) {
        throw new Error('Chưa thể tính toán Calo mục tiêu.');
    }

    const configObj   = await UserMealConfig.findOne({ where: { userId } });
    const mealsConfig = configObj ? configObj.meals : [
        { key: 'sang', percent: 25 },
        { key: 'trua', percent: 35 },
        { key: 'toi',  percent: 30 },
        { key: 'phu',  percent: 10 },
    ];

    const allTargets = mealPlannerService.allocateMealTargets(metrics.targetCalories, metrics.macros, mealsConfig);
    const mealTarget = allTargets[mealKey];
    if (!mealTarget) throw new Error(`Bữa ăn '${mealKey}' không tồn tại trong cấu hình.`);
    return mealTarget;
};

// ─── GET /api/v1/meal-planner/config ─────────────────────────────────────────
exports.getConfig = async (req, res) => {
    try {
        const userId = req.user.id;
        let config = await UserMealConfig.findOne({ where: { userId } });
        if (!config) {
            config = await UserMealConfig.create({
                userId,
                meals: [
                    { key: 'sang', label: 'Bữa sáng', percent: 25 },
                    { key: 'trua', label: 'Bữa trưa', percent: 35 },
                    { key: 'toi',  label: 'Bữa tối',  percent: 30 },
                    { key: 'phu',  label: 'Bữa phụ',  percent: 10 },
                ],
            });
        }
        return res.success(config.meals);
    } catch (err) {
        console.error('[API] getConfig error:', err);
        return res.error('Lỗi server khi lấy cấu hình bữa ăn.', 500);
    }
};

// ─── PUT /api/v1/meal-planner/config ─────────────────────────────────────────
exports.updateConfig = async (req, res) => {
    try {
        const userId = req.user.id;
        const { meals } = req.body;

        if (!meals || !Array.isArray(meals)) {
            return res.error('Dữ liệu không hợp lệ.', 400);
        }

        const totalPercent = meals.reduce((sum, m) => sum + (Number(m.percent) || 0), 0);
        if (totalPercent !== 100) {
            return res.error('Tổng phần trăm các bữa ăn phải là 100%.', 400);
        }

        let config = await UserMealConfig.findOne({ where: { userId } });
        if (config) {
            config.meals = meals;
            await config.save();
        } else {
            await UserMealConfig.create({ userId, meals });
        }

        return res.success(null, 'Cập nhật cấu hình thành công.');
    } catch (err) {
        console.error('[API] updateConfig error:', err);
        return res.error('Lỗi server khi cập nhật cấu hình.', 500);
    }
};

// ─── GET /api/v1/meal-planner/templates ──────────────────────────────────────
exports.getTemplates = async (req, res) => {
    try {
        const templates = await MealTemplate.findAll({ where: { isActive: true } });
        return res.success(templates);
    } catch (err) {
        console.error('[API] getTemplates error:', err);
        return res.error('Lỗi server khi lấy khuôn mẫu bữa ăn.', 500);
    }
};

// ─── POST /api/v1/meal-planner/generate ──────────────────────────────────────
exports.generateMeal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mealKey, templateId, preferences } = req.body;

        if (!mealKey || !templateId) {
            return res.error('Thiếu tham số mealKey hoặc templateId.', 400);
        }

        const template = await MealTemplate.findByPk(templateId);
        if (!template) {
            return res.error('Không tìm thấy MealTemplate.', 404);
        }

        const mealTarget = await getMealTarget(userId, mealKey);

        // Auto-inject allergies vào exclude list
        const user        = await User.findByPk(userId);
        const allergyIds  = user.allergies || [];
        const mergedPrefs = {
            ...preferences,
            exclude: [...(preferences?.exclude || []), ...allergyIds],
        };

        const result = await mealPlannerService.generateMealPlan(template, mealTarget, mergedPrefs);

        if (!result.success && result.errors.some(e => e.type === 'FATAL')) {
            return res.status(400).json(result);
        }

        // Nếu có lỗi NEGATIVE_WEIGHT do protein chứa quá nhiều fat, đề xuất lean protein
        if (!result.success && result.errors?.some(e => e.type === 'NEGATIVE_WEIGHT' && e.message.includes('quá nhiều mỡ'))) {
            result.leanAlternatives = await mealPlannerService.getLeanAlternatives();
        }

        return res.json(result);
    } catch (err) {
        console.error('[API] generateMeal error:', err);
        return res.error(err.message || 'Lỗi server khi sinh bữa ăn.', 500);
    }
};

// ─── POST /api/v1/meal-planner/swap ──────────────────────────────────────────
exports.swapIngredient = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mealKey, currentFoodIds, newFoodId, slotRoleToSwap } = req.body;

        if (!mealKey || !currentFoodIds || !newFoodId || !slotRoleToSwap) {
            return res.error('Thiếu tham số.', 400);
        }

        const mealTarget = await getMealTarget(userId, mealKey);

        const foods = [];
        for (const fId of currentFoodIds) {
            const f = await Food.findByPk(fId);
            if (f) foods.push(f.toJSON());
        }

        const foodIndex = foods.findIndex(f => f.category === slotRoleToSwap || f.role === slotRoleToSwap);
        if (foodIndex === -1) {
            return res.error('Không tìm thấy slot cần swap trong danh sách hiện tại.', 400);
        }

        const newFood = await Food.findByPk(newFoodId);
        if (!newFood) {
            return res.error('Món ăn mới không tồn tại.', 404);
        }

        foods[foodIndex] = newFood.toJSON();

        const weights = mealPlannerService.calculateWeights(foods, mealTarget);
        if (!weights) {
            return res.json({
                success: false,
                errors : [{ type: 'MATH_ERROR', severity: 'error', message: 'Tổ hợp này làm ma trận bị suy biến (không thể giải). Hãy chọn nguyên liệu khác.' }],
            });
        }

        const validation = mealPlannerService.validateSolution(weights);
        
        let responsePayload = validation.isValid
            ? { success: true,  data: weights, warnings: validation.errors }
            : { success: false, data: weights, errors  : validation.errors };

        if (!validation.isValid && validation.errors?.some(e => e.type === 'NEGATIVE_WEIGHT' && e.message.includes('quá nhiều mỡ'))) {
            responsePayload.leanAlternatives = await mealPlannerService.getLeanAlternatives();
        }

        return res.json(responsePayload);
    } catch (err) {
        console.error('[API] swapIngredient error:', err);
        return res.error(err.message || 'Lỗi server khi swap nguyên liệu.', 500);
    }
};

// ─── GET /api/v1/meal-planner/foods ──────────────────────────────────────────
exports.getFoodsByRole = async (req, res) => {
    try {
        const { role, tags, excludeAllergies } = req.query;

        let allergyIds = [];
        if (excludeAllergies !== 'false') {
            const user = await User.findByPk(req.user.id);
            allergyIds = user.allergies || [];
        }

        const whereClause = { foodType: 'raw' };
        if (role) whereClause.category = role;

        if (allergyIds.length > 0) {
            const { Op } = require('sequelize');
            whereClause.id = { [Op.notIn]: allergyIds };
        }

        let foods = await Food.findAll({
            where     : whereClause,
            attributes: ['id', 'name', 'calories', 'protein', 'carbs', 'fat', 'unit', 'tags', 'category', 'imageUrl'],
        });

        // Lọc theo tags nếu có
        if (tags) {
            const tagList  = tags.split(',');
            const filtered = foods.filter(f => {
                const foodTags = f.tags || [];
                return tagList.some(tag => foodTags.includes(tag));
            });
            if (filtered.length > 0) foods = filtered;
        }

        return res.success(foods);
    } catch (err) {
        console.error('[API] getFoodsByRole error:', err);
        return res.error('Lỗi lấy danh sách món ăn.', 500);
    }
};
