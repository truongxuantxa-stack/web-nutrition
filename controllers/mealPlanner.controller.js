'use strict';

const { User, UserMealConfig, MealTemplate, Food } = require('../models');
const mealPlannerService = require('../services/mealPlanner.service');
const nutritionService = require('../services/nutrition.service');

// 1. GET /api/meal-planner/config
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
                    { key: 'toi', label: 'Bữa tối', percent: 30 },
                    { key: 'phu', label: 'Bữa phụ', percent: 10 }
                ]
            });
        }
        res.json({ success: true, data: config.meals });
    } catch (error) {
        console.error('Error getConfig:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy cấu hình bữa ăn.' });
    }
};

// 2. PUT /api/meal-planner/config
exports.updateConfig = async (req, res) => {
    try {
        const userId = req.user.id;
        const { meals } = req.body;
        
        if (!meals || !Array.isArray(meals)) {
            return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
        }

        const totalPercent = meals.reduce((sum, m) => sum + (Number(m.percent) || 0), 0);
        if (totalPercent !== 100) {
            return res.status(400).json({ success: false, message: 'Tổng phần trăm các bữa ăn phải là 100%.' });
        }
        
        let config = await UserMealConfig.findOne({ where: { userId } });
        if (config) {
            config.meals = meals;
            await config.save();
        } else {
            await UserMealConfig.create({ userId, meals });
        }
        
        res.json({ success: true, message: 'Cập nhật cấu hình thành công.' });
    } catch (error) {
        console.error('Error updateConfig:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật cấu hình.' });
    }
};

// 3. GET /api/meal-planner/templates
exports.getTemplates = async (req, res) => {
    try {
        const templates = await MealTemplate.findAll({ where: { isActive: true } });
        res.json({ success: true, data: templates });
    } catch (error) {
        console.error('Error getTemplates:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy khuôn mẫu bữa ăn.' });
    }
};

// Hàm phụ trợ tính Target bữa ăn cho user
const getMealTarget = async (userId, mealKey) => {
    const user = await User.findByPk(userId);
    if (!user || !user.weight || !user.height) {
        throw new Error('Bạn cần cập nhật đủ thông tin chỉ số cơ thể trước.');
    }

    const metrics = nutritionService.calculateAllMetrics(user);
    if (!metrics || !metrics.targetCalories) {
        throw new Error('Chưa thể tính toán Calo mục tiêu.');
    }

    let configObj = await UserMealConfig.findOne({ where: { userId } });
    const mealsConfig = configObj ? configObj.meals : [
        { key: 'sang', percent: 25 },
        { key: 'trua', percent: 35 },
        { key: 'toi', percent: 30 },
        { key: 'phu', percent: 10 }
    ];

    const allTargets = mealPlannerService.allocateMealTargets(metrics.targetCalories, metrics.macros, mealsConfig);
    const mealTarget = allTargets[mealKey];

    if (!mealTarget) throw new Error(`Bữa ăn '${mealKey}' không tồn tại trong cấu hình.`);

    return mealTarget;
};

// 4. POST /api/meal-planner/generate
exports.generateMeal = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mealKey, templateId, preferences } = req.body;

        if (!mealKey || !templateId) {
            return res.status(400).json({ success: false, message: 'Thiếu tham số mealKey hoặc templateId.' });
        }

        const template = await MealTemplate.findByPk(templateId);
        if (!template) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy MealTemplate.' });
        }

        const mealTarget = await getMealTarget(userId, mealKey);

        // Gọi Orchestrator M1->M4
        const result = await mealPlannerService.generateMealPlan(template, mealTarget, preferences || {});

        if (!result.success && result.errors.some(e => e.type === 'FATAL')) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error generateMeal:', error);
        res.status(500).json({ success: false, message: error.message || 'Lỗi server khi sinh bữa ăn.' });
    }
};

// 5. POST /api/meal-planner/swap (hoặc tính lại khi chỉ đổi 1 món)
exports.swapIngredient = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mealKey, currentFoodIds, newFoodId, slotRoleToSwap } = req.body;
        // currentFoodIds: mảng các ID món ăn hiện tại (4 món)
        // newFoodId: ID của món muốn thay thế vào
        // slotRoleToSwap: nhóm bị thay thế (VD: 'protein')

        if (!mealKey || !currentFoodIds || !newFoodId || !slotRoleToSwap) {
            return res.status(400).json({ success: false, message: 'Thiếu tham số.' });
        }

        const mealTarget = await getMealTarget(userId, mealKey);

        // Lấy thông tin chi tiết các món hiện tại
        const foods = [];
        for (const fId of currentFoodIds) {
            const f = await Food.findByPk(fId);
            if (f) foods.push(f.toJSON());
        }

        // Tìm món cần thay thế
        const foodIndex = foods.findIndex(f => f.category === slotRoleToSwap || f.role === slotRoleToSwap);
        if (foodIndex === -1) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy slot cần swap trong danh sách hiện tại.' });
        }

        // Lấy thông tin món mới
        const newFood = await Food.findByPk(newFoodId);
        if (!newFood) {
            return res.status(404).json({ success: false, message: 'Món ăn mới không tồn tại.' });
        }

        // Thay món cũ bằng món mới
        foods[foodIndex] = newFood.toJSON();

        // Chạy lại Module 3 và Module 4
        const weights = mealPlannerService.calculateWeights(foods, mealTarget);
        if (!weights) {
            return res.json({ 
                success: false, 
                errors: [{ type: 'MATH_ERROR', severity: 'error', message: 'Tổ hợp này làm ma trận bị suy biến (không thể giải). Hãy chọn nguyên liệu khác.' }] 
            });
        }

        const validation = mealPlannerService.validateSolution(weights);

        if (validation.isValid) {
            return res.json({
                success: true,
                data: weights,
                warnings: validation.errors // warning nhẹ
            });
        } else {
            return res.json({
                success: false,
                data: weights,
                errors: validation.errors
            });
        }
    } catch (error) {
        console.error('Error swapIngredient:', error);
        res.status(500).json({ success: false, message: error.message || 'Lỗi server khi swap nguyên liệu.' });
    }
};
