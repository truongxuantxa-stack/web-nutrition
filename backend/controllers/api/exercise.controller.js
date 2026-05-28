'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/api/exercise.controller.js
// Lớp mỏng: nhận request → gọi exercise.service → trả JSON.
// ═══════════════════════════════════════════════════════════════════════════════

const { ExerciseLog } = require('../../models');
const {
    getSupportedSports,
    getSportInfo,
    addExerciseLog,
    deleteExerciseLog,
} = require('../../services/exercise.service');
const { toLocalDateString, toDateString } = require('../../utils/date.helper');

// ─── GET /api/v1/exercise?date= ──────────────────────────────────────────────
exports.getExercise = async (req, res) => {
    try {
        const user = req.user;
        const date = toDateString(req.query.date);

        const logs = await ExerciseLog.findAll({
            where: { userId: user.id, date },
            order: [['createdAt', 'ASC']],
        });

        const logsWithInfo = logs.map(log => {
            const info = getSportInfo(log.sport);
            return {
                id            : log.id,
                sport         : log.sport,
                sportLabel    : info.label,
                sportIcon     : info.icon,
                duration      : log.duration,
                caloriesBurned: log.caloriesBurned,
                date          : log.date,
            };
        });
        const totalBurned = Math.round(logsWithInfo.reduce((sum, l) => sum + l.caloriesBurned, 0));

        return res.success({ date, logs: logsWithInfo, totalBurned });
    } catch (err) {
        console.error('[API] getExercise error:', err);
        return res.error('Lỗi server.', 500);
    }
};

// ─── POST /api/v1/exercise ────────────────────────────────────────────────────
exports.addExercise = async (req, res) => {
    try {
        const weightKg = parseFloat(req.user.weight) || 60;
        const result   = await addExerciseLog(req.user.id, req.body, weightKg);
        return res.success({
            message: `Đã ghi nhận ${result.log.duration} phút ${result.log.sportLabel}!`,
            log    : result.log,
        });
    } catch (err) {
        if (err.status) return res.error(err.message, err.status);
        if (err.name === 'SequelizeValidationError') return res.error(err.errors[0].message, 400);
        console.error('[API] addExercise error:', err);
        return res.error('Đã có lỗi xảy ra.', 500);
    }
};

// ─── DELETE /api/v1/exercise/:id ─────────────────────────────────────────────
exports.deleteExercise = async (req, res) => {
    try {
        await deleteExerciseLog(req.user.id, req.params.id);
        return res.success({ message: 'Đã xóa mục luyện tập.' });
    } catch (err) {
        if (err.status) return res.error(err.message, err.status);
        console.error('[API] deleteExercise error:', err);
        return res.error('Đã có lỗi xảy ra.', 500);
    }
};

// ─── GET /api/v1/exercise/sports ─────────────────────────────────────────────
exports.getSports = (req, res) => {
    return res.success({ sports: getSupportedSports() });
};
