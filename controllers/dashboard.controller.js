'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/dashboard.controller.js
// Tổng quan dinh dưỡng hàng ngày — được tách từ routes/index.js để dễ mở rộng
// ═══════════════════════════════════════════════════════════════════════════════

const { DiaryEntry, Food, WeightLog } = require('../models');
const { calculateAllMetrics } = require('../services/nutrition.service');
const {
    sumNutritionFromEntries,
    getCalorieProgress,
    getMacroProgress,
} = require('../services/suggestion.service');

// ─── Helper: format ngày YYYY-MM-DD theo local timezone ──────────────────────
const toLocalDateString = (d) => {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ─── GET /dashboard ───────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
    try {
        const user    = req.user;
        const metrics = calculateAllMetrics(user);
        // Dùng local timezone, tránh lệch ngày ở múi giờ +07:00 (trước 7h sáng)
        const today   = toLocalDateString(new Date());

        // Nhật ký hôm nay
        const todayEntries = await DiaryEntry.findAll({
            where  : { userId: user.id, date: today },
            include: [{ model: Food, as: 'food' }],
        });
        const consumed = sumNutritionFromEntries(todayEntries);
        const calorieProgress = getCalorieProgress(consumed.calories, metrics.targetCalories);
        const macroProgress   = getMacroProgress(consumed, metrics.macros || {});

        // Lịch sử cân nặng (7 ngày gần nhất cho biểu đồ mini)
        const weightLogs = await WeightLog.findAll({
            where: { userId: user.id },
            order: [['date', 'DESC']],
            limit: 7,
        });
        const weightChartData = [...weightLogs].reverse().map(l => ({ date: l.date, weight: l.weight }));

        res.render('dashboard/index', {
            title           : 'Tổng Quan',
            activePage      : 'dashboard',
            user,
            metrics,
            today,
            consumed: {
                calories: Math.round(consumed.calories),
                protein : Math.round(consumed.protein),
                carbs   : Math.round(consumed.carbs),
                fat     : Math.round(consumed.fat),
            },
            calorieProgress,
            macroProgress,
            weightChartData : JSON.stringify(weightChartData),
            mealCount       : todayEntries.length,
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).render('404', { title: 'Lỗi hệ thống' });
    }
};
