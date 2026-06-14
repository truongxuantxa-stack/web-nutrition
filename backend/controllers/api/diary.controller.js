'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/api/diary.controller.js
// Lớp mỏng: nhận request → gọi services → trả JSON.
// ═══════════════════════════════════════════════════════════════════════════════

const { DiaryEntry, Food }  = require('../../models');
const {
    calculateAllMetrics,
    calculateWaterGoal,
} = require('../../services/nutrition.service');
const {
    sumNutritionFromEntries,
    groupEntriesByMeal,
    getCalorieProgress,
    getMacroProgress,
    getHealthInsights,
    calculateDailyHealthScore,
} = require('../../services/suggestion.service');
const { getTotalBurnedByDate } = require('../../services/exercise.service');
const { getWaterByDate }       = require('../../services/water.service');
const {
    addDiaryEntry,
    deleteDiaryEntry,
    searchFood    : searchFoodSvc,
    createCustomFood,
    updateCustomFood,
    deleteCustomFood,
} = require('../../services/diary.service');
const { Op } = require('sequelize');
const { toDateString } = require('../../utils/date.helper');

// ─── GET /api/v1/diary?date=YYYY-MM-DD ───────────────────────────────────────
exports.getDiary = async (req, res) => {
    try {
        const user    = req.user;
        const date    = toDateString(req.query.date);
        const metrics = calculateAllMetrics(user);

        const entries = await DiaryEntry.findAll({
            where  : { userId: user.id, date },
            include: [{ model: Food, as: 'food', paranoid: false }],
            order  : [['createdAt', 'ASC']],
        });

        const mealGroups      = groupEntriesByMeal(entries);
        const consumed        = sumNutritionFromEntries(entries);
        const totalBurned     = await getTotalBurnedByDate(user.id, date);
        const calorieProgress = getCalorieProgress(consumed.calories, metrics.targetCalories || 0);
        const macroProgress   = getMacroProgress(consumed, metrics.macros || {});

        const { total: waterTotal, logs: waterLogs } = await getWaterByDate(user.id, date);
        const waterGoal = user.waterGoal || calculateWaterGoal(user.weight);

        const healthInsights  = getHealthInsights(
            consumed, metrics, mealGroups,
            waterTotal, waterGoal, user.gender
        );
        const healthScore     = calculateDailyHealthScore(
            consumed, metrics, waterTotal, waterGoal, healthInsights, user.gender
        );

        const mealCalories = { sang: 0, trua: 0, toi: 0, phu: 0 };
        Object.keys(mealGroups).forEach(meal => {
            mealCalories[meal] = Math.round(sumNutritionFromEntries(mealGroups[meal]).calories);
        });

        return res.success({
            date,
            metrics,
            entries: entries.map(e => ({
                id              : e.id,
                foodId          : e.foodId,
                foodName        : e.food?.name || 'Đã xóa',
                imageUrl        : e.food?.imageUrl || null,
                amount          : e.amount,
                unit            : e.food?.unit || '',
                mealType        : e.mealType,
                caloriesSnapshot: e.caloriesSnapshot,
                proteinSnapshot : e.proteinSnapshot,
                carbsSnapshot   : e.carbsSnapshot,
                fatSnapshot     : e.fatSnapshot,
                fiberSnapshot    : e.fiberSnapshot,
                sugarSnapshot    : e.sugarSnapshot,
                sodiumSnapshot   : e.sodiumSnapshot,
                vitaminASnapshot : e.vitaminASnapshot,
                vitaminCSnapshot : e.vitaminCSnapshot,
                calciumSnapshot  : e.calciumSnapshot,
                ironSnapshot     : e.ironSnapshot,
                note             : e.note,
            })),
            mealGroups: Object.fromEntries(
                Object.entries(mealGroups).map(([meal, list]) => [
                    meal,
                    list.map(e => ({
                        id              : e.id,
                        foodId          : e.foodId,
                        foodName        : e.food?.name || 'Đã xóa',
                        imageUrl        : e.food?.imageUrl || null,
                        amount          : e.amount,
                        unit            : e.food?.unit || '',
                        mealType        : e.mealType,
                        caloriesSnapshot: e.caloriesSnapshot,
                        proteinSnapshot : e.proteinSnapshot,
                        carbsSnapshot   : e.carbsSnapshot,
                        fatSnapshot     : e.fatSnapshot,
                        fiberSnapshot    : e.fiberSnapshot,
                        sugarSnapshot    : e.sugarSnapshot,
                        sodiumSnapshot   : e.sodiumSnapshot,
                        vitaminASnapshot : e.vitaminASnapshot,
                        vitaminCSnapshot : e.vitaminCSnapshot,
                        calciumSnapshot  : e.calciumSnapshot,
                        ironSnapshot     : e.ironSnapshot,
                    }))
                ])
            ),
            mealCalories,
            consumed: {
                calories: Math.round(consumed.calories),
                protein : Math.round(consumed.protein),
                carbs   : Math.round(consumed.carbs),
                fat     : Math.round(consumed.fat),
                fiber   : consumed.fiber  != null ? Math.round(consumed.fiber  * 10) / 10 : null,
                sugar   : consumed.sugar  != null ? Math.round(consumed.sugar  * 10) / 10 : null,
                sodium  : consumed.sodium != null ? Math.round(consumed.sodium * 10) / 10 : null,
            },
            totalBurned,
            calorieProgress,
            macroProgress,
            healthInsights,
            healthScore,
            waterTotal,
            waterGoal,
            waterLogs: waterLogs.map(l => ({
                id       : l.id,
                amount   : l.amount,
                note     : l.note,
                createdAt: l.createdAt,
            })),
        });
    } catch (err) {
        console.error('[API] getDiary error:', err);
        return res.error('Lỗi server khi lấy nhật ký.', 500);
    }
};

// ─── POST /api/v1/diary/entries ──────────────────────────────────────────────
exports.addEntry = async (req, res) => {
    try {
        const result = await addDiaryEntry(req.user.id, req.body);
        return res.success({
            message: `Đã thêm ${result.entry.foodName} vào nhật ký!`,
            entry  : result.entry,
        });
    } catch (err) {
        if (err.status) return res.error(err.message, err.status);
        if (err.name === 'SequelizeValidationError') return res.error(err.errors[0].message, 400);
        console.error('[API] addEntry error:', err);
        return res.error('Đã có lỗi xảy ra. Vui lòng thử lại.', 500);
    }
};

// ─── DELETE /api/v1/diary/entries/:id ────────────────────────────────────────
exports.deleteEntry = async (req, res) => {
    try {
        await deleteDiaryEntry(req.user.id, req.params.id);
        return res.success({ message: 'Đã xóa mục nhật ký.' });
    } catch (err) {
        if (err.status) return res.error(err.message, err.status);
        console.error('[API] deleteEntry error:', err);
        return res.error('Đã có lỗi xảy ra. Vui lòng thử lại.', 500);
    }
};

// ─── GET /api/v1/diary/foods/search ──────────────────────────────────────────
exports.searchFood = async (req, res) => {
    try {
        const result = await searchFoodSvc(req.user.id, req.query);
        return res.success(result);
    } catch (err) {
        console.error('[API] searchFood error:', err);
        return res.error('Lỗi tìm kiếm.', 500);
    }
};

// ─── POST /api/v1/diary/foods ─────────────────────────────────────────────────
exports.createCustomFood = async (req, res) => {
    try {
        const result = await createCustomFood(req.user.id, req.body);
        return res.success({
            message: `Đã tạo món "${result.food.name}" thành công!`,
            food   : result.food,
        });
    } catch (err) {
        if (err.status) return res.error(err.message, err.status);
        if (err.name === 'SequelizeValidationError') return res.error(err.errors[0].message, 400);
        console.error('[API] createCustomFood error:', err);
        return res.error('Đã có lỗi xảy ra. Vui lòng thử lại.', 500);
    }
};

// ─── PUT /api/v1/diary/foods/:id ─────────────────────────────────────────────
exports.updateCustomFood = async (req, res) => {
    try {
        const result = await updateCustomFood(req.user.id, req.params.id, req.body);
        return res.success({
            message: `Đã cập nhật món "${result.food.name}" thành công!`,
            food   : result.food,
        });
    } catch (err) {
        if (err.status) return res.error(err.message, err.status);
        console.error('[API] updateCustomFood error:', err);
        return res.error('Đã có lỗi xảy ra.', 500);
    }
};

// ─── DELETE /api/v1/diary/foods/:id ──────────────────────────────────────────
exports.deleteCustomFood = async (req, res) => {
    try {
        const result = await deleteCustomFood(req.user.id, req.params.id);
        return res.success({
            message: `Đã xóa món "${result.foodName}". Lịch sử nhật ký cũ vẫn được bảo tồn.`,
        });
    } catch (err) {
        if (err.status) return res.error(err.message, err.status);
        console.error('[API] deleteCustomFood error:', err);
        return res.error('Đã có lỗi xảy ra.', 500);
    }
};

// ─── GET /api/v1/diary/foods/my ──────────────────────────────────────────────
exports.getMyCustomFoods = async (req, res) => {
    try {
        const foods = await Food.findAll({
            where     : { userId: req.user.id, isCustom: true },
            order     : [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'unit', 'category', 'foodType', 'isCustom', 'createdAt'],
        });
        return res.success({ foods });
    } catch (err) {
        console.error('[API] getMyCustomFoods error:', err);
        return res.error('Lỗi server.', 500);
    }
};

// ─── GET /api/v1/diary/recent?date=YYYY-MM-DD&limit=5 ──────────────────────
exports.getRecentEntries = async (req, res) => {
    try {
        const date  = toDateString(req.query.date);
        const limit = Math.min(parseInt(req.query.limit) || 5, 20);

        const entries = await DiaryEntry.findAll({
            where  : { userId: req.user.id, date },
            include: [{ model: Food, as: 'food', attributes: ['name', 'unit', 'imageUrl'] }],
            order  : [['createdAt', 'DESC']],
            limit,
        });

        return res.success({
            entries: entries.map(e => ({
                id              : e.id,
                foodName        : e.food?.name || 'Đã xóa',
                imageUrl        : e.food?.imageUrl || null,
                amount          : e.amount,
                unit            : e.food?.unit || '',
                mealType        : e.mealType,
                caloriesSnapshot: e.caloriesSnapshot,
            })),
        });
    } catch (err) {
        console.error('[API] getRecentEntries error:', err);
        return res.error('Lỗi server.', 500);
    }
};
