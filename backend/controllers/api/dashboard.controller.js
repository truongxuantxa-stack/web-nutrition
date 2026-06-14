'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/api/dashboard.controller.js
// GET /api/v1/dashboard?date=YYYY-MM-DD — trả JSON tổng hợp dashboard
// Wrap lại service layer, không sửa controller EJS cũ
// ═══════════════════════════════════════════════════════════════════════════════

const { DiaryEntry, Food, WeightLog, ExerciseLog } = require('../../models');
const { calculateAllMetrics, calculateWaterGoal }  = require('../../services/nutrition.service');
const {
    sumNutritionFromEntries,
    getCalorieProgress,
    getMacroProgress,
    getHealthInsights,
    calculateDailyHealthScore,
} = require('../../services/suggestion.service');
const { getWaterByDate } = require('../../services/water.service');

// ─── Helper ──────────────────────────────────────────────────────────────────
const toLocalDateString = (d) => {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ─── GET /api/v1/dashboard?date=YYYY-MM-DD ────────────────────────────────────
exports.getDashboard = async (req, res) => {
    try {
        const user    = req.user;
        const metrics = calculateAllMetrics(user);

        // Dùng query param nếu có, fallback hôm nay
        let date = req.query.date;
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            date = toLocalDateString(new Date());
        }

        // Nhật ký ngày được chọn
        const entries = await DiaryEntry.findAll({
            where  : { userId: user.id, date },
            include: [{ model: Food, as: 'food' }],
        });
        const consumed        = sumNutritionFromEntries(entries);
        const calorieProgress = getCalorieProgress(consumed.calories, metrics.targetCalories || 0);
        const macroProgress   = getMacroProgress(consumed, metrics.macros || {});

        // Nước uống
        const { total: waterTotal } = await getWaterByDate(user.id, date);
        const waterGoal = user.waterGoal || calculateWaterGoal(user.weight);

        // Health Insights + Score
        const healthInsights = getHealthInsights(
            consumed, metrics, {},
            waterTotal, waterGoal, user.gender
        );
        const healthScore = calculateDailyHealthScore(
            consumed, metrics, waterTotal, waterGoal, healthInsights, user.gender
        );
        const weightLogs = await WeightLog.findAll({
            where: { userId: user.id },
            order: [['date', 'DESC']],
            limit: 7,
        });
        const weightChartData = [...weightLogs].reverse().map(l => ({ date: l.date, weight: l.weight }));

        // Tổng calo đốt và danh sách tập luyện trong ngày
        const exerciseLogs = await ExerciseLog.findAll({
            where     : { userId: user.id, date },
            attributes: ['id', 'sport', 'duration', 'caloriesBurned', 'intensity', 'createdAt'],
            order     : [['createdAt', 'DESC']],
        });
        const totalBurned = Math.round(exerciseLogs.reduce((sum, l) => sum + l.caloriesBurned, 0));

        // Nước uống — đã tính bên trên, chỉ cần lấy logs nếu cần

        return res.success({
            user: {
                id          : user.id,
                name        : user.fullName,
                email       : user.email,
                isOnboarded : user.isOnboarded,
                weight      : user.weight,
                height      : user.height,
                goal        : user.goal,
                gender      : user.gender,
            },
            date,
            metrics,
            consumed: {
                calories: Math.round(consumed.calories),
                protein : Math.round(consumed.protein),
                carbs   : Math.round(consumed.carbs),
                fat     : Math.round(consumed.fat),
                fiber   : consumed.fiber != null ? Math.round(consumed.fiber) : null,
                sugar   : consumed.sugar != null ? Math.round(consumed.sugar) : null,
                sodium  : consumed.sodium != null ? Math.round(consumed.sodium) : null,
                vitaminA: consumed.vitaminA != null ? Math.round(consumed.vitaminA) : null,
                vitaminC: consumed.vitaminC != null ? Math.round(consumed.vitaminC) : null,
                calcium : consumed.calcium != null ? Math.round(consumed.calcium) : null,
                iron    : consumed.iron != null ? Math.round(consumed.iron) : null,
            },
            totalBurned,
            exerciseLogs,
            calorieProgress,
            macroProgress,
            weightChartData,
            healthInsights,
            healthScore,
            mealCount: entries.length,
            waterTotal,
            waterGoal,
        });
    } catch (err) {
        console.error('[API] getDashboard error:', err);
        return res.error('Lỗi server khi lấy dữ liệu dashboard.', 500);
    }
};
