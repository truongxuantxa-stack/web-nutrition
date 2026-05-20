'use strict';

const { DiaryEntry, WeightLog, AdaptiveTDEELog, User } = require('../models');
const { Op } = require('sequelize');
const nutritionService = require('./nutrition.service');

const KILOCALORIES_PER_KG_FAT = 7700;
const EMA_ALPHA = 0.1;
const DAYS_IN_WEEK = 7;
const MIN_DAYS_LOGGED = 5;
const MIN_WEIGHT_LOGS = 2;

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
    // Lùi lại 14 ngày trước ngày bắt đầu tuần để lấy dữ liệu "Warm-up" cho EMA
    const startDate = new Date(weekStart);
    startDate.setDate(startDate.getDate() - 14);
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

    // Lọc riêng các log của tuần hiện tại để kiểm tra điều kiện số lượng tối thiểu
    const currentWeekLogs = logs.filter(log => log.date >= weekStart && log.date <= weekEnd);
    if (currentWeekLogs.length < MIN_WEIGHT_LOGS) return null;

    let ema = logs[0].weight;
    let startWeight = null;
    const targetStart = new Date(weekStart);

    for (let i = 0; i < logs.length; i++) {
        if (i > 0) {
            ema = (EMA_ALPHA * logs[i].weight) + ((1 - EMA_ALPHA) * ema);
        }
        
        // Khi bắt đầu chạm hoặc vượt qua ngày bắt đầu tuần hiện tại, ghi nhận startWeight từ EMA đã làm ấm
        const logDate = new Date(logs[i].date);
        if (logDate >= targetStart && startWeight === null) {
            startWeight = ema;
        }
    }

    const endWeight = ema;

    // Trường hợp dự phòng nếu không tìm thấy startWeight do lệch múi giờ hoặc định dạng ngày
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
    let confidence = 'high';
    if (daysLogged <= 5) confidence = 'low';
    else if (daysLogged === 6) confidence = 'medium';

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
