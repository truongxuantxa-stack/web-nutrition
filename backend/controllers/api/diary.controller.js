'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/api/diary.controller.js
// Wrap lại diary service layer cho React SPA — trả JSON thuần
// ═══════════════════════════════════════════════════════════════════════════════

const { DiaryEntry, Food } = require('../../models');
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
} = require('../../services/suggestion.service');
const { getTotalBurnedByDate } = require('../exercise.controller');
const { getWaterByDate }       = require('../water.controller');
const { Op }                   = require('sequelize');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toLocalDateString = (d) => {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toDateString = (date) => {
    if (!date) return toLocalDateString(new Date());
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    if (isNaN(d.getTime())) return toLocalDateString(new Date());
    return toLocalDateString(d);
};

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
        const healthInsights  = getHealthInsights(consumed, metrics, mealGroups);

        const mealCalories = { sang: 0, trua: 0, toi: 0, phu: 0 };
        Object.keys(mealGroups).forEach(meal => {
            mealCalories[meal] = Math.round(sumNutritionFromEntries(mealGroups[meal]).calories);
        });

        const { total: waterTotal, logs: waterLogs } = await getWaterByDate(user.id, date);
        const waterGoal = user.waterGoal || calculateWaterGoal(user.weight);

        return res.success({
            date,
            metrics,
            entries: entries.map(e => ({
                id              : e.id,
                foodId          : e.foodId,
                foodName        : e.food?.name || 'Đã xóa',
                amount          : e.amount,
                unit            : e.food?.unit || '',
                mealType        : e.mealType,
                caloriesSnapshot: e.caloriesSnapshot,
                proteinSnapshot : e.proteinSnapshot,
                carbsSnapshot   : e.carbsSnapshot,
                fatSnapshot     : e.fatSnapshot,
                fiberSnapshot   : e.fiberSnapshot,
                sugarSnapshot   : e.sugarSnapshot,
                sodiumSnapshot  : e.sodiumSnapshot,
                note            : e.note,
            })),
            mealGroups: Object.fromEntries(
                Object.entries(mealGroups).map(([meal, list]) => [
                    meal,
                    list.map(e => ({
                        id              : e.id,
                        foodId          : e.foodId,
                        foodName        : e.food?.name || 'Đã xóa',
                        amount          : e.amount,
                        unit            : e.food?.unit || '',
                        mealType        : e.mealType,
                        caloriesSnapshot: e.caloriesSnapshot,
                        proteinSnapshot : e.proteinSnapshot,
                        carbsSnapshot   : e.carbsSnapshot,
                        fatSnapshot     : e.fatSnapshot,
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
// Forward trực tiếp sang diary.controller.addEntry (đã trả JSON sẵn)
exports.addEntry = require('../diary.controller').addEntry;

// ─── DELETE /api/v1/diary/entries/:id ────────────────────────────────────────
exports.deleteEntry = require('../diary.controller').deleteEntry;

// ─── GET /api/v1/diary/foods/search ──────────────────────────────────────────
exports.searchFood = require('../diary.controller').searchFood;

// ─── POST /api/v1/diary/foods ─────────────────────────────────────────────────
exports.createCustomFood = require('../diary.controller').createCustomFood;

// ─── PUT /api/v1/diary/foods/:id ─────────────────────────────────────────────
exports.updateCustomFood = require('../diary.controller').updateCustomFood;

// ─── DELETE /api/v1/diary/foods/:id ──────────────────────────────────────────
exports.deleteCustomFood = require('../diary.controller').deleteCustomFood;

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
