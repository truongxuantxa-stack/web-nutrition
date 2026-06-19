'use strict';

const { DiaryEntry, WeightLog, AdaptiveTDEELog, User } = require('../models');
const { Op } = require('sequelize');
const nutritionService = require('./nutrition.service');

const KILOCALORIES_PER_KG_FAT = 7700;
const EMA_ALPHA = 0.1;
const DAYS_IN_WEEK = 7;
const MIN_DAYS_LOGGED = 5;
const MIN_WEIGHT_LOGS = 2;
/** [FIX #7] Hằng số thay thế magic number 14 trong warm-up EMA */
const EMA_WARMUP_DAYS = 14;

/**
 * Helper: Chuẩn hóa Date object hoặc string về định dạng 'YYYY-MM-DD'.
 * [FIX #1] Sequelize có thể trả về Date object (MySQL) hoặc string (PostgreSQL) tùy dialect.
 * So sánh trực tiếp Date >= string sẽ cho kết quả sai — luôn chuẩn hóa trước khi so sánh.
 * @param {Date|string} date
 * @returns {string} Chuỗi 'YYYY-MM-DD'
 */
const normalizeDate = (date) => {
    if (date instanceof Date) return date.toISOString().split('T')[0];
    return String(date).split('T')[0];
};

/**
 * 1. Calculate Average Weekly Intake
 */
const calculateWeeklyIntake = async (userId, weekStart, weekEnd) => {
    const entries = await DiaryEntry.findAll({
        where: {
            userId,
            date: {
                [Op.gte]: weekStart,
                [Op.lte]: weekEnd
            }
        },
        attributes: ['date', 'caloriesSnapshot']
    });

    const dailyTotals = {};
    entries.forEach(entry => {
        if (!dailyTotals[entry.date]) dailyTotals[entry.date] = 0;
        dailyTotals[entry.date] += entry.caloriesSnapshot;
    });

    const daysLogged = Object.keys(dailyTotals).length;
    
    if (daysLogged === 0) return { avgIntake: 0, daysLogged: 0 };

    const totalIntake = Object.values(dailyTotals).reduce((sum, val) => sum + val, 0);
    return {
        avgIntake: totalIntake / daysLogged,
        daysLogged
    };
};

/**
 * 2. Calculate Smoothed Weight (EMA)
 */
const calculateSmoothedWeight = async (userId, weekStart, weekEnd) => {
    // [FIX #7] Dùng hằng số EMA_WARMUP_DAYS thay vì magic number 14
    const startDate = new Date(weekStart);
    startDate.setDate(startDate.getDate() - EMA_WARMUP_DAYS);
    const warmUpStart = startDate.toISOString().split('T')[0];

    const logs = await WeightLog.findAll({
        where: {
            userId,
            date: {
                [Op.gte]: warmUpStart,
                [Op.lte]: weekEnd
            }
        },
        order: [['date', 'ASC']]
    });

    // [FIX #1] Dùng normalizeDate() để so sánh an toàn — tránh bug Date vs string tùy dialect DB
    const currentWeekLogs = logs.filter(log => {
        const d = normalizeDate(log.date);
        return d >= weekStart && d <= weekEnd;
    });
    if (currentWeekLogs.length < MIN_WEIGHT_LOGS) return null;

    // [FIX #2] Khởi tạo EMA = logs[0].weight, bắt vòng lặp từ i=1.
    // Lỗi cũ: vòng lặp từ i=0 với `if (i > 0)` → khi chỉ có 1 log, EMA không bao giờ
    // được cập nhật, weightDelta luôn = 0 và thuật toán im lặng bỏ qua dữ liệu.
    let ema = logs[0].weight;
    let startWeight = null;

    // Kiểm tra ngay log đầu tiên có nằm trong tuần hiện tại không
    if (normalizeDate(logs[0].date) >= weekStart && startWeight === null) {
        startWeight = ema;
    }

    for (let i = 1; i < logs.length; i++) {
        ema = (EMA_ALPHA * logs[i].weight) + ((1 - EMA_ALPHA) * ema);

        // Khi chạm hoặc vượt ngày bắt đầu tuần, ghi nhận startWeight từ EMA đã làm ấm
        if (normalizeDate(logs[i].date) >= weekStart && startWeight === null) {
            startWeight = ema;
        }
    }

    const endWeight = ema;

    // Dự phòng nếu toàn bộ logs đều nằm trước tuần hiện tại (trường hợp dữ liệu cũ rất thưa)
    if (startWeight === null && currentWeekLogs.length > 0) {
        startWeight = currentWeekLogs[0].weight;
    }

    return {
        startWeight,
        endWeight,
        weightDelta: endWeight - startWeight,
        logsCount: currentWeekLogs.length
    };
};

/**
 * 3. Calculate Adaptive TDEE
 */
const calculateWeeklyAdaptiveTDEE = (avgIntake, weightDelta) => {
    return avgIntake - (weightDelta * KILOCALORIES_PER_KG_FAT / DAYS_IN_WEEK);
};

/**
 * 4. Calculate Rolling Average TDEE
 */
const calculateRollingTDEE = async (userId, currentWeeklyTDEE, userGoal) => {
    // Lấy 3 tuần gần nhất (để cộng với tuần hiện tại = 4 tuần)
    // Cập nhật (Sprint 5): Lọc theo userGoal để reset rolling average nếu user đổi mục tiêu
    const pastLogs = await AdaptiveTDEELog.findAll({
        where: {
            userId,
            userGoal,
            status: {
                [Op.in]: ['applied', 'clamped']
            }
        },
        order: [['weekStartDate', 'DESC']],
        limit: 3
    });

    let sum = currentWeeklyTDEE;
    let count = 1;

    pastLogs.forEach(log => {
        // [NOTE #4] Dùng calculatedTDEE (giá trị tuần thô, đã clamp) — KHÔNG dùng log.rollingTDEE.
        // Nếu dùng rollingTDEE sẽ gây "smoothing kép" (average của averages), làm thuật toán
        // mất độ nhạy và phản ứng chậm hơn với sự thay đổi thực tế của cơ thể.
        sum += log.calculatedTDEE;
        count++;
    });

    return sum / count;
};

/**
 * 5. Orchestrator: Process Weekly Adaptation
 */
const processWeeklyAdaptation = async (userId, weekStart, weekEnd) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    // Kiểm tra xem tuần này đã bị user đánh dấu skip chưa
    const existingLog = await AdaptiveTDEELog.findOne({
        where: { userId, weekStartDate: weekStart }
    });

    if (existingLog && existingLog.status === 'skipped_by_user') {
        return existingLog; // Bỏ qua nếu user đã cố tình skip
    }

    const { avgIntake, daysLogged } = await calculateWeeklyIntake(userId, weekStart, weekEnd);
    const weightData = await calculateSmoothedWeight(userId, weekStart, weekEnd);

    const userMetrics = nutritionService.calculateAllMetrics(user);
    const staticTDEE = userMetrics.tdee;
    // [FIX #6] Guard: Nếu user chưa đủ thông tin (chiều cao, cân nặng, tuổi),
    // staticTDEE = NaN/undefined → clamp bounds (staticTDEE * 0.7) cũng thành NaN,
    // toàn bộ cơ chế bảo vệ dữ liệu cực đoan bị vô hiệu hóa hoàn toàn.
    if (!staticTDEE || isNaN(staticTDEE)) {
        throw new Error(`Không thể tính static TDEE cho user ${userId}: thiếu thông tin cá nhân (chiều cao, cân nặng, tuổi).`);
    }
    const targetCalories = userMetrics.targetCalories;
    const userGoal = user.goal;

    // Nếu không đủ data
    if (daysLogged < MIN_DAYS_LOGGED || !weightData) {
        if (existingLog) {
            await existingLog.update({ status: 'skipped_low_data' });
            return existingLog;
        } else {
            return await AdaptiveTDEELog.create({
                userId,
                weekStartDate: weekStart,
                weekEndDate: weekEnd,
                avgDailyIntake: avgIntake || 0,
                daysLogged,
                startWeight: weightData ? weightData.startWeight : 0,
                endWeight: weightData ? weightData.endWeight : 0,
                weightDelta: weightData ? weightData.weightDelta : 0,
                calculatedTDEE: 0,
                rollingTDEE: 0,
                staticTDEE,
                userGoal,
                targetCalories,
                status: 'skipped_low_data',
                confidence: 'low'
            });
        }
    }

    // Đủ data -> Tính toán
    let calculatedTDEE = calculateWeeklyAdaptiveTDEE(avgIntake, weightData.weightDelta);
    
    // CLAMP ±30%
    const minBound = staticTDEE * 0.7;
    const maxBound = staticTDEE * 1.3;
    let status = 'applied';
    
    if (calculatedTDEE < minBound) {
        calculatedTDEE = minBound;
        status = 'clamped';
    } else if (calculatedTDEE > maxBound) {
        calculatedTDEE = maxBound;
        status = 'clamped';
    }

    // Truyền thêm userGoal vào để reset rolling nếu goal thay đổi
    const rollingTDEE = await calculateRollingTDEE(userId, calculatedTDEE, userGoal);

    // Tính confidence
    // [FIX #3] Logic cũ: daysLogged <= 5 là 'low' — nhưng MIN_DAYS_LOGGED = 5 nên
    // 5 ngày là ngưỡng HỢP LỆ, không hợp lý khi gán 'low' trùng với điều kiện tối thiểu.
    // Logic mới: chỉ 7 ngày đầy đủ mới là 'high'; 6 ngày là 'medium'; 5 ngày là 'low'.
    let confidence;
    if (daysLogged === DAYS_IN_WEEK) confidence = 'high';
    else if (daysLogged === 6) confidence = 'medium';
    else confidence = 'low';

    let savedLog;
    if (existingLog) {
        savedLog = await existingLog.update({
            avgDailyIntake: avgIntake,
            daysLogged,
            startWeight: weightData.startWeight,
            endWeight: weightData.endWeight,
            weightDelta: weightData.weightDelta,
            calculatedTDEE,
            rollingTDEE,
            staticTDEE,
            userGoal,
            targetCalories,
            status,
            confidence
        });
    } else {
        savedLog = await AdaptiveTDEELog.create({
            userId,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            avgDailyIntake: avgIntake,
            daysLogged,
            startWeight: weightData.startWeight,
            endWeight: weightData.endWeight,
            weightDelta: weightData.weightDelta,
            calculatedTDEE,
            rollingTDEE,
            staticTDEE,
            userGoal,
            targetCalories,
            status,
            confidence
        });
    }

    // Chỉ cập nhật User.adaptiveTDEE khi đã có ít nhất 2 tuần hợp lệ (applied/clamped) cùng mục tiêu
    // savedLog đã được lưu ở trên, nên count này bao gồm cả tuần hiện tại.
    // validWeeksCount >= 2 tức là tuần hiện tại là tuần thứ 2 trở lên của mục tiêu này.
    const validWeeksCount = await AdaptiveTDEELog.count({
        where: {
            userId,
            userGoal,
            status: { [Op.in]: ['applied', 'clamped'] }
        }
    });

    if (validWeeksCount >= 2) {
        await user.update({ adaptiveTDEE: rollingTDEE });
    }
    // Nếu validWeeksCount === 1 (tuần đầu tiên): log đã được lưu làm baseline,
    // nhưng User.adaptiveTDEE vẫn giữ nguyên null → hệ thống dùng TDEE tĩnh.

    return savedLog;
};

module.exports = {
    calculateWeeklyIntake,
    calculateSmoothedWeight,
    calculateWeeklyAdaptiveTDEE,
    calculateRollingTDEE,
    processWeeklyAdaptation
};
