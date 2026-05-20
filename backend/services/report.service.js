'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/report.service.js
// Thu thập và tổng hợp dữ liệu dinh dưỡng để tạo báo cáo PDF
// ═══════════════════════════════════════════════════════════════════════════════

const { User, DiaryEntry, WeightLog, ExerciseLog, WaterLog, AdaptiveTDEELog, Food } = require('../models');
const { calculateAllMetrics, calculateWaterGoal } = require('./nutrition.service');
const { sumNutritionFromEntries } = require('./suggestion.service');
const { Op } = require('sequelize');

/**
 * Tính ngày bắt đầu và kết thúc theo range.
 * @param {'week'|'month'} range
 * @returns {{ startDate: Date, endDate: Date, totalDays: number }}
 */
const getDateRange = (range) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (range === 'month') {
        startDate.setDate(startDate.getDate() - 29); // 30 ngày
    } else {
        startDate.setDate(startDate.getDate() - 6); // 7 ngày
    }

    const totalDays = range === 'month' ? 30 : 7;
    return { startDate, endDate, totalDays };
};

/**
 * Format ngày thành DD/MM/YYYY.
 * @param {Date} date
 * @returns {string}
 */
const formatDate = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/**
 * Format ngày thành YYYY-MM-DD (key).
 * @param {Date} date
 * @returns {string}
 */
const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Thu thập và tổng hợp toàn bộ dữ liệu báo cáo.
 * @param {number} userId
 * @param {'week'|'month'} range
 * @returns {Promise<Object>} Dữ liệu báo cáo đầy đủ
 */
const getReportData = async (userId, range = 'week') => {
    const { startDate, endDate, totalDays } = getDateRange(range);

    // ── Query song song ──────────────────────────────────────────────────────
    const [user, diaryEntries, weightLogs, exerciseLogs, waterLogs, adaptiveLogs] = await Promise.all([
        User.findByPk(userId),
        DiaryEntry.findAll({
            where: {
                userId,
                date: { [Op.between]: [formatDateKey(startDate), formatDateKey(endDate)] },
            },
            include: [{ model: Food, as: 'food', required: false }],
            order: [['date', 'ASC']],
        }),
        WeightLog.findAll({
            where: {
                userId,
                date: { [Op.between]: [formatDateKey(startDate), formatDateKey(endDate)] },
            },
            order: [['date', 'ASC']],
        }),
        ExerciseLog.findAll({
            where: {
                userId,
                date: { [Op.between]: [formatDateKey(startDate), formatDateKey(endDate)] },
            },
            order: [['date', 'ASC']],
        }),
        WaterLog.findAll({
            where: {
                userId,
                date: { [Op.between]: [formatDateKey(startDate), formatDateKey(endDate)] },
            },
            order: [['date', 'ASC']],
        }),
        AdaptiveTDEELog.findAll({
            where: { userId },
            order: [['weekStartDate', 'DESC']],
            limit: 6, // Lấy thêm 1 để có đủ sau khi loại tuần 1 baseline
        }),
    ]);

    // ── Tính chỉ số dinh dưỡng cơ bản ───────────────────────────────────────
    const metrics = calculateAllMetrics(user);
    const waterGoal = calculateWaterGoal(user.weight) || 2000;

    // ── Nhóm diary entries theo ngày ─────────────────────────────────────────
    const diaryByDate = {};
    diaryEntries.forEach(entry => {
        const key = entry.date; // DATEONLY → 'YYYY-MM-DD'
        if (!diaryByDate[key]) diaryByDate[key] = [];
        diaryByDate[key].push(entry);
    });

    // ── Nhóm exercise logs theo ngày ─────────────────────────────────────────
    const exerciseByDate = {};
    exerciseLogs.forEach(log => {
        const key = log.date;
        if (!exerciseByDate[key]) exerciseByDate[key] = 0;
        exerciseByDate[key] += log.caloriesBurned || 0;
    });

    // ── Nhóm water logs theo ngày ────────────────────────────────────────────
    const waterByDate = {};
    waterLogs.forEach(log => {
        const key = log.date;
        if (!waterByDate[key]) waterByDate[key] = 0;
        waterByDate[key] += log.amount || 0;
    });

    // ── Tổng hợp daily log (chỉ ngày CÓ diary) ──────────────────────────────
    const dailyLog = Object.entries(diaryByDate).map(([date, entries]) => {
        const nutrition = sumNutritionFromEntries(entries);
        return {
            date,
            dateFormatted: (() => {
                const [y, m, d] = date.split('-');
                return `${d}/${m}`;
            })(),
            calories: Math.round(nutrition.calories),
            protein:  Math.round(nutrition.protein),
            carbs:    Math.round(nutrition.carbs),
            fat:      Math.round(nutrition.fat),
            water:    waterByDate[date] || 0,
            exerciseBurned: Math.round(exerciseByDate[date] || 0),
        };
    });

    // ── Summary tổng hợp ─────────────────────────────────────────────────────
    const daysWithData = dailyLog.length;
    const isEmpty = daysWithData === 0;

    let summary = {
        avgCalories: 0,
        avgProtein: 0,
        avgCarbs: 0,
        avgFat: 0,
        avgWater: 0,
        totalExerciseCalories: 0,
        calorieCompliance: 0, // % số ngày đạt ±10% target
        daysWithData,
        weightStart: null,
        weightEnd: null,
        weightDelta: null,
    };

    if (!isEmpty) {
        const totalCal  = dailyLog.reduce((s, d) => s + d.calories, 0);
        const totalProt = dailyLog.reduce((s, d) => s + d.protein, 0);
        const totalCarb = dailyLog.reduce((s, d) => s + d.carbs, 0);
        const totalFat  = dailyLog.reduce((s, d) => s + d.fat, 0);
        const totalWater = dailyLog.reduce((s, d) => s + d.water, 0);
        const totalExercise = dailyLog.reduce((s, d) => s + d.exerciseBurned, 0);

        summary.avgCalories = Math.round(totalCal / daysWithData);
        summary.avgProtein  = Math.round(totalProt / daysWithData);
        summary.avgCarbs    = Math.round(totalCarb / daysWithData);
        summary.avgFat      = Math.round(totalFat / daysWithData);
        summary.avgWater    = Math.round(totalWater / daysWithData);
        summary.totalExerciseCalories = Math.round(totalExercise);

        // Compliance: % ngày đạt ±10% calo target
        if (metrics.targetCalories) {
            const target = metrics.targetCalories;
            const compliantDays = dailyLog.filter(d => {
                const pct = d.calories / target;
                return pct >= 0.9 && pct <= 1.1;
            }).length;
            summary.calorieCompliance = Math.round((compliantDays / daysWithData) * 100);
        }
    }

    // ── Cân nặng đầu/cuối kỳ ────────────────────────────────────────────────
    if (weightLogs.length > 0) {
        summary.weightStart = weightLogs[0].weight;
        summary.weightEnd   = weightLogs[weightLogs.length - 1].weight;
        summary.weightDelta = Math.round((summary.weightEnd - summary.weightStart) * 10) / 10;
    }

    // ── Label khoảng thời gian ───────────────────────────────────────────────
    const periodLabel = `${formatDate(startDate)} — ${formatDate(endDate)}`;

    // ── Thông tin user ───────────────────────────────────────────────────────
    const GOAL_LABELS = {
        lose_weight:     'Giảm cân',
        maintain_weight: 'Duy trì cân nặng',
        gain_weight:     'Tăng cân',
    };
    const GENDER_LABELS = { male: 'Nam', female: 'Nữ' };

    const userInfo = {
        fullName: user.fullName || 'Chưa cập nhật',
        email:    user.email   || '',
        gender:   GENDER_LABELS[user.gender] || 'Chưa cập nhật',
        age:      metrics.age  || '–',
        height:   user.height  || '–',
        weight:   user.weight  || '–',
        goal:     GOAL_LABELS[user.goal] || 'Chưa cập nhật',
    };

    // ── Lọc adaptive logs: bỏ tuần 1 baseline ───────────────────────────────
    // Tuần 1 chỉ là điểm cơ sở, User.adaptiveTDEE chưa được cập nhật lúc đó.
    // adaptiveLogs DESC nên phần tử cuối = tuần cũ nhất (= tuần 1 baseline).
    const validLogs = adaptiveLogs.filter(l => ['applied', 'clamped'].includes(l.status));
    const displayLogs = validLogs.length >= 2
        ? validLogs.slice(0, validLogs.length - 1) // bỏ phần tử cuối = tuần 1
        : [];

    return {
        user: userInfo,
        period: {
            startDate,
            endDate,
            label: periodLabel,
            totalDays,
            rangeLabel: range === 'week' ? '7 ngày gần đây' : '30 ngày gần đây',
        },
        metrics: {
            bmi:             metrics.bmi,
            bmiClass:        metrics.bmiClass?.label || '–',
            bmr:             metrics.bmr,
            tdee:            metrics.staticTDEE,        // TDEE tĩnh (Harris-Benedict) — không dùng adaptive
            adaptiveTDEE:    user.adaptiveTDEE ? Math.round(user.adaptiveTDEE) : null,
            useAdaptiveTDEE: user.useAdaptiveTDEE,
            targetCalories:  metrics.targetCalories,
            macros:          metrics.macros,
            macroRatios:     metrics.macroRatios,
            waterGoal,
        },
        dailyLog,
        summary,
        adaptiveTDEE: displayLogs.map(l => ({
            weekStart:   l.weekStartDate,
            weekEnd:     l.weekEndDate,
            tdee:        l.calculatedTDEE,
            rollingTDEE: l.rollingTDEE,
            status:      l.status,
        })),
        isEmpty,
    };
};

module.exports = { getReportData };
