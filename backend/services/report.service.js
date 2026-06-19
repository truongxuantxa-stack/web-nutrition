'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/report.service.js
// Thu thập và tổng hợp dữ liệu dinh dưỡng để tạo báo cáo PDF
// ═══════════════════════════════════════════════════════════════════════════════

const { User, DiaryEntry, WeightLog, ExerciseLog, WaterLog, AdaptiveTDEELog, Food } = require('../models');
const { calculateAllMetrics, calculateWaterGoal } = require('./nutrition.service');
const { sumNutritionFromEntries, getHealthInsights, calculateDailyHealthScore } = require('./suggestion.service');
const { buildWeeklyFoodReport } = require('./foodScoring.service');
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
 * Phân tích thực phẩm đóng góp nhiều nhất (Top Foods Contributors)
 * @param {Array} diaryEntries 
 */
const buildTopFoodsContributors = (diaryEntries) => {
    const foodMap = {};
    
    diaryEntries.forEach(entry => {
        const id = entry.foodId;
        if (!foodMap[id]) {
            foodMap[id] = {
                name: entry.food?.name || `Food #${id}`,
                sugar: 0, sodium: 0, count: 0,
            };
        }
        foodMap[id].count += 1;
        foodMap[id].sugar    += entry.sugarSnapshot    || 0;
        foodMap[id].sodium   += entry.sodiumSnapshot   || 0;
    });

    const foods = Object.values(foodMap);
    const buildTop = (key, limit = 5) => {
        const total = foods.reduce((s, f) => s + f[key], 0);
        if (total === 0) return [];
        return foods
            .filter(f => f[key] > 0)
            .sort((a, b) => b[key] - a[key])
            .slice(0, limit)
            .map((f, i) => ({
                rank: i + 1,
                name: f.name,
                count: f.count,
                value: Math.round(f[key]),
                percentage: Math.round((f[key] / total) * 100),
            }));
    };

    return {
        sugar:    buildTop('sugar'),
        sodium:   buildTop('sodium'),
    };
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

    // ── Nhóm weight logs theo ngày ───────────────────────────────────────────
    const weightByDate = {};
    weightLogs.forEach(log => {
        const key = log.date;
        weightByDate[key] = log.weight; // Lấy cân nặng của ngày đó
    });

    // ── Tổng hợp daily log (tất cả các ngày có bất kỳ hoạt động nào) ─────────
    const allDates = new Set([
        ...Object.keys(diaryByDate),
        ...Object.keys(exerciseByDate),
        ...Object.keys(waterByDate),
        ...Object.keys(weightByDate)
    ]);

    const dailyLog = Array.from(allDates).sort().map(date => {
        const entries = diaryByDate[date] || [];
        const nutrition = sumNutritionFromEntries(entries);
        const dayWater = waterByDate[date] || 0;

        const dayConsumed = {
            calories: Math.round(nutrition.calories),
            protein:  Math.round(nutrition.protein),
            carbs:    Math.round(nutrition.carbs),
            fat:      Math.round(nutrition.fat),
            fiber:    nutrition.fiber != null ? Math.round(nutrition.fiber) : null,
            sugar:    nutrition.sugar != null ? Math.round(nutrition.sugar) : null,
            sodium:   nutrition.sodium != null ? Math.round(nutrition.sodium) : null,
            vitaminA: nutrition.vitaminA != null ? Math.round(nutrition.vitaminA) : null,
            vitaminC: nutrition.vitaminC != null ? Math.round(nutrition.vitaminC) : null,
            calcium:  nutrition.calcium != null ? Math.round(nutrition.calcium) : null,
            iron:     nutrition.iron != null ? Math.round(nutrition.iron) : null,
        };

        const dayInsights = getHealthInsights(
            dayConsumed, metrics, {}, dayWater, waterGoal, user.gender, true
        );
        const dayScore = calculateDailyHealthScore(
            dayConsumed, metrics, dayWater, waterGoal, dayInsights, user.gender
        );

        return {
            date,
            dateFormatted: (() => {
                const [y, m, d] = date.split('-');
                return `${d}/${m}`;
            })(),
            ...dayConsumed,
            water:    dayWater,
            exerciseBurned: Math.round(exerciseByDate[date] || 0),
            weight:   weightByDate[date] || null,
            healthScore: dayScore.score,
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
        avgFiber: 0,
        avgVitaminA: 0,
        avgVitaminC: 0,
        avgCalcium: 0,
        avgIron: 0,
        avgSugar: null,
        avgSodium: null,
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
        
        // Fiber, VitaminA, VitaminC, Calcium, Iron: chỉ tính trung bình từ những ngày CÓ dữ liệu
        const daysWithFiber = dailyLog.filter(d => d.fiber != null);
        const totalFiber = daysWithFiber.reduce((s, d) => s + d.fiber, 0);

        const daysWithVitA = dailyLog.filter(d => d.vitaminA != null);
        const totalVitA = daysWithVitA.reduce((s, d) => s + d.vitaminA, 0);

        const daysWithVitC = dailyLog.filter(d => d.vitaminC != null);
        const totalVitC = daysWithVitC.reduce((s, d) => s + d.vitaminC, 0);

        const daysWithCalcium = dailyLog.filter(d => d.calcium != null);
        const totalCalcium = daysWithCalcium.reduce((s, d) => s + d.calcium, 0);

        const daysWithIron = dailyLog.filter(d => d.iron != null);
        const totalIron = daysWithIron.reduce((s, d) => s + d.iron, 0);

        const daysWithSugar = dailyLog.filter(d => d.sugar != null);
        const totalSugar = daysWithSugar.reduce((s, d) => s + d.sugar, 0);

        const daysWithSodium = dailyLog.filter(d => d.sodium != null);
        const totalSodium = daysWithSodium.reduce((s, d) => s + d.sodium, 0);

        const totalWater = dailyLog.reduce((s, d) => s + d.water, 0);
        const totalExercise = dailyLog.reduce((s, d) => s + d.exerciseBurned, 0);

        summary.avgCalories = Math.round(totalCal / daysWithData);
        summary.avgProtein  = Math.round(totalProt / daysWithData);
        summary.avgCarbs    = Math.round(totalCarb / daysWithData);
        summary.avgFat      = Math.round(totalFat / daysWithData);
        summary.avgFiber    = daysWithFiber.length > 0 ? Math.round(totalFiber / daysWithFiber.length) : 0;
        summary.avgVitaminA = daysWithVitA.length > 0 ? Math.round(totalVitA / daysWithVitA.length) : 0;
        summary.avgVitaminC = daysWithVitC.length > 0 ? Math.round(totalVitC / daysWithVitC.length) : 0;
        summary.avgCalcium  = daysWithCalcium.length > 0 ? Math.round(totalCalcium / daysWithCalcium.length) : 0;
        summary.avgIron     = daysWithIron.length > 0 ? Math.round(totalIron / daysWithIron.length) : 0;
        summary.avgSugar    = daysWithSugar.length > 0 ? Math.round(totalSugar / daysWithSugar.length) : null;
        summary.avgSodium   = daysWithSodium.length > 0 ? Math.round(totalSodium / daysWithSodium.length) : null;
        summary.avgWater    = Math.round(totalWater / daysWithData);
        summary.totalExerciseCalories = Math.round(totalExercise);

        // Compliance: % ngày đạt ±10% calo target
        // Chỉ tính từ các ngày thực sự có ghi diary (calories > 0)
        if (metrics.targetCalories) {
            const target = metrics.targetCalories;
            const daysWithDiary = dailyLog.filter(d => d.calories > 0);
            const compliantDays = daysWithDiary.filter(d => {
                const pct = d.calories / target;
                return pct >= 0.9 && pct <= 1.1;
            }).length;
            summary.calorieCompliance = daysWithDiary.length > 0
                ? Math.round((compliantDays / daysWithDiary.length) * 100)
                : 0;
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

    // ── Tính toán adaptiveInsight ──────────────────────────────────────────
    const staticTDEE = metrics.staticTDEE || 2000;
    const adaptiveTDEEVal = user.adaptiveTDEE ? Math.round(user.adaptiveTDEE) : null;
    const hasAdaptiveData = !!(user.useAdaptiveTDEE && adaptiveTDEEVal);

    let adaptiveInsight = {
        hasData: false,
        staticTDEE: Math.round(staticTDEE),
        adaptiveTDEE: null,
        diff: 0,
        diffPct: 0,
        isPlateauing: false,
        suggestedTargetCalories: Math.round(metrics.targetCalories || 2000),
        currentTargetCalories: Math.round(metrics.targetCalories || 2000),
        message: '💡 Chưa kích hoạt hoặc chưa đủ dữ liệu TDEE Thích ứng để đề xuất kế hoạch hành động. Hãy tiếp tục ghi chép nhật ký dinh dưỡng và cân nặng đều đặn.'
    };

    if (hasAdaptiveData) {
        const diff = Math.round(adaptiveTDEEVal - staticTDEE);
        const diffPct = Math.round((diff / staticTDEE) * 100 * 10) / 10;
        const isPlateauing = diffPct < -5;

        // Tính suggestedTargetCalories
        let suggested = adaptiveTDEEVal;
        if (user.goal === 'lose_weight') {
            suggested = adaptiveTDEEVal - 500;
        } else if (user.goal === 'gain_weight') {
            suggested = adaptiveTDEEVal + 300;
        } else if (user.goal === 'maintain_weight') {
            suggested = adaptiveTDEEVal;
        }
        // Clamp min = BMR (không bao giờ dưới BMR)
        const bmrVal = metrics.bmr ? Math.round(metrics.bmr) : 1200;
        suggested = Math.max(suggested, bmrVal);

        let message = '';
        const currentTarget = Math.round(metrics.targetCalories || 2000);
        if (isPlateauing) {
            if (Math.round(suggested) === currentTarget) {
                message = `⚡ Cơ thể bạn đang có dấu hiệu chững cân (TDEE thực tế giảm xuống ${adaptiveTDEEVal} kcal/ngày, thấp hơn ${Math.abs(diffPct)}% so với công thức tĩnh). Tuy nhiên, mức calo hiện tại của bạn đã chạm ngưỡng an toàn tối thiểu (BMR). Hệ thống đề xuất bạn DUY TRÌ mục tiêu ở mức ${Math.round(suggested)} kcal/ngày, tuyệt đối không cắt giảm thêm để chờ phục hồi chuyển hóa.`;
            } else {
                message = `⚡ Cơ thể bạn đang có dấu hiệu thích ứng chuyển hóa (chững cân). TDEE thực tế đã giảm xuống ${adaptiveTDEEVal} kcal/ngày (thấp hơn ${Math.abs(diffPct)}% so với công thức tĩnh). Hệ thống đề xuất bạn điều chỉnh Mục tiêu Calo cho tuần tới về mức ${Math.round(suggested)} kcal/ngày để tiếp tục giảm mỡ an toàn.`;
            }
        } else if (diffPct > 5) {
            message = `📈 Cơ thể bạn đang tiêu hao năng lượng nhiều hơn dự kiến (TDEE thực tế cao hơn ${diffPct}% so với công thức tĩnh). Bạn có thể thoải mái ăn thêm mà vẫn bám sát mục tiêu.`;
        } else {
            message = `✅ TDEE thích ứng xác nhận công thức tĩnh đang phản ánh chính xác cơ địa thực tế của bạn. Hãy tiếp tục duy trì chế độ ăn hiện tại.`;
        }

        adaptiveInsight = {
            hasData: true,
            staticTDEE: Math.round(staticTDEE),
            adaptiveTDEE: adaptiveTDEEVal,
            diff,
            diffPct,
            isPlateauing,
            suggestedTargetCalories: Math.round(suggested),
            currentTargetCalories: Math.round(metrics.targetCalories || 2000),
            message
        };
    }

    // ── Health Insights & Score trung bình toàn kỳ (isHistorical = true) ──
    const avgConsumed = {
        calories: summary.avgCalories,
        protein:  summary.avgProtein,
        carbs:    summary.avgCarbs,
        fat:      summary.avgFat,
        fiber:    summary.avgFiber || null,
        sugar:    summary.avgSugar,
        sodium:   summary.avgSodium,
        vitaminA: summary.avgVitaminA || null,
        vitaminC: summary.avgVitaminC || null,
        calcium:  summary.avgCalcium || null,
        iron:     summary.avgIron || null,
    };

    const reportInsights = isEmpty ? [] : getHealthInsights(
        avgConsumed, metrics, {},
        summary.avgWater, waterGoal, user.gender, true
    );

    const reportHealthScore = isEmpty
        ? { score: null, label: 'Chưa có dữ liệu', emoji: '🍽️', bonuses: [] }
        : calculateDailyHealthScore(
            avgConsumed, metrics, summary.avgWater, waterGoal, reportInsights, user.gender
        );

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
            tdee:            metrics.staticTDEE,        // TDEE tĩnh (Mifflin-St Jeor) — không dùng adaptive
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
        adaptiveInsight,
        healthInsights: reportInsights,
        healthScore: reportHealthScore,
        topFoods: isEmpty 
            ? { calories: [], protein: [], sugar: [], sodium: [], fiber: [] } 
            : buildTopFoodsContributors(diaryEntries),
        foodScoringReport: isEmpty ? null : buildWeeklyFoodReport(diaryEntries, range),
        isEmpty,
    };
};

module.exports = { getReportData };
