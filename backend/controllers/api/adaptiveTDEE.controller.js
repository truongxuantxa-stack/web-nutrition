'use strict';

const adaptiveService = require('../../services/adaptiveTDEE.service');
const { AdaptiveTDEELog, User } = require('../../models');
const nutritionService = require('../../services/nutrition.service');

// Lấy ngày Thứ Hai của tuần hiện tại
const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
};

const getWeekEnd = (weekStart) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
};

exports.getStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);
        const metrics = nutritionService.calculateAllMetrics(user);

        const currentWeekStart = getWeekStart();
        const latestLog = await AdaptiveTDEELog.findOne({
            where: { userId },
            order: [['weekStartDate', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                isAdaptiveActive: metrics.isAdaptiveActive,
                useAdaptiveTDEE: user.useAdaptiveTDEE,
                staticTDEE: metrics.staticTDEE,
                adaptiveTDEE: user.adaptiveTDEE,
                currentTDEE: metrics.tdee,
                targetCalories: metrics.targetCalories,
                latestLog: latestLog ? {
                    weekStartDate: latestLog.weekStartDate,
                    status: latestLog.status,
                    confidence: latestLog.confidence,
                    weightDelta: latestLog.weightDelta,
                    avgDailyIntake: latestLog.avgDailyIntake
                } : null
            }
        });
    } catch (error) {
        console.error('Error getting adaptive TDEE status:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.calculateNow = async (req, res) => {
    try {
        const userId = req.user.id;
        // Tính toán cho tuần trước đó, vì tuần hiện tại chưa kết thúc
        const today = new Date();
        today.setDate(today.getDate() - 7);
        
        const weekStart = getWeekStart(today);
        const weekEnd = getWeekEnd(weekStart);

        const log = await adaptiveService.processWeeklyAdaptation(userId, weekStart, weekEnd);

        res.json({
            success: true,
            message: 'Đã tính toán xong Adaptive TDEE',
            data: log
        });
    } catch (error) {
        console.error('Error calculating adaptive TDEE:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.toggle = async (req, res) => {
    try {
        const userId = req.user.id;
        const { useAdaptiveTDEE } = req.body;

        if (typeof useAdaptiveTDEE !== 'boolean') {
            return res.status(400).json({ success: false, message: 'Giá trị không hợp lệ' });
        }

        await User.update(
            { useAdaptiveTDEE },
            { where: { id: userId } }
        );

        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        console.error('Error toggling adaptive TDEE:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const logs = await AdaptiveTDEELog.findAll({
            where: { userId },
            order: [['weekStartDate', 'ASC']],
            limit: 12 // 3 months
        });

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Error getting adaptive TDEE history:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

exports.skipWeek = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentWeekStart = getWeekStart();
        const weekEnd = getWeekEnd(currentWeekStart);

        // Check if log exists
        let log = await AdaptiveTDEELog.findOne({
            where: { userId, weekStartDate: currentWeekStart }
        });

        if (log) {
            await log.update({ status: 'skipped_by_user' });
        } else {
            // Snapshot userGoal và staticTDEE tại thời điểm skip để lịch sử có thể truy vết
            const user = await User.findByPk(userId);
            const metrics = nutritionService.calculateAllMetrics(user);

            log = await AdaptiveTDEELog.create({
                userId,
                weekStartDate: currentWeekStart,
                weekEndDate: weekEnd,
                avgDailyIntake: 0,
                daysLogged: 0,
                startWeight: 0,
                endWeight: 0,
                weightDelta: 0,
                calculatedTDEE: 0,
                rollingTDEE: 0,
                staticTDEE: metrics.staticTDEE || 0,
                userGoal: user.goal,
                targetCalories: metrics.targetCalories || 0,
                status: 'skipped_by_user',
                confidence: 'low'
            });
        }

        res.json({ success: true, message: 'Đã đánh dấu bỏ qua tuần này' });
    } catch (error) {
        console.error('Error skipping week:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
