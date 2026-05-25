'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/api/exercise.controller.js
// Wrap exercise service cho React SPA — GET trả JSON
// ═══════════════════════════════════════════════════════════════════════════════

const { ExerciseLog }                     = require('../../models');
const {
    getSupportedSports,
    getSportInfo,
    calculateExerciseCalories,
} = require('../../services/exercise.service');

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
// Forward trực tiếp — đã trả JSON sẵn
exports.addExercise = require('../exercise.controller').addExercise;

// ─── DELETE /api/v1/exercise/:id ─────────────────────────────────────────────
exports.deleteExercise = require('../exercise.controller').deleteExercise;

// ─── GET /api/v1/exercise/sports ─────────────────────────────────────────────
exports.getSports = (req, res) => {
    return res.success({ sports: getSupportedSports() });
};
