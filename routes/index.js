'use strict';

const express = require('express');
const router  = express.Router();
const { requireAuth, requireOnboarded, optionalAuth } = require('../middlewares/auth.middleware');

// ─── Trang chủ: redirect ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
    res.redirect('/dang-nhap');
});

// ─── Auth Routes ─────────────────────────────────────────────────────────────
const authRoutes = require('./auth.routes');
router.use('/', authRoutes);

// ─── Dashboard (cần đăng nhập + onboarded) ───────────────────────────────────
const { calculateAllMetrics } = require('../services/nutrition.service');
const { DiaryEntry, Food, WeightLog } = require('../models');
const { sumNutritionFromEntries, getCalorieProgress, getMacroProgress } = require('../services/suggestion.service');

router.get('/dashboard', requireAuth, requireOnboarded, async (req, res) => {
    try {
        const user    = req.user;
        const metrics = calculateAllMetrics(user);
        // Dùng local timezone, tránh lệch ngày ở múi giờ +07:00 (trước 7h sáng)
        const now     = new Date();
        const today   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

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
});

// ─── Phase 4: Diary & Weight routes (cần đăng nhập + onboarded) ─────────────
const diaryRoutes  = require('./diary.routes');
const weightRoutes = require('./weight.routes');
router.use('/', requireAuth, requireOnboarded, diaryRoutes);
router.use('/', requireAuth, requireOnboarded, weightRoutes);

module.exports = router;
