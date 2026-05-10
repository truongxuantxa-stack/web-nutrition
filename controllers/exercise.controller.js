'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/exercise.controller.js
// Quản lý nhật ký luyện tập: xem, thêm, xóa
// ═══════════════════════════════════════════════════════════════════════════════

const { ExerciseLog } = require('../models');
const {
    calculateExerciseCalories,
    getSupportedSports,
    getSportInfo,
    INTENSITY_LABELS,
} = require('../services/exercise.service');

// ─── Helper: format ngày YYYY-MM-DD theo local timezone ──────────────────────
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

// ─── GET /luyen-tap ────────────────────────────────────────────────────────────
exports.getExercise = async (req, res) => {
    try {
        const user  = req.user;
        const date  = toDateString(req.query.date);
        const today = toLocalDateString(new Date());

        const logs = await ExerciseLog.findAll({
            where: { userId: user.id, date },
            order: [['createdAt', 'ASC']],
        });

        // Gắn thêm label/icon từ service để dùng trong view
        const logsWithInfo = logs.map(log => {
            const info = getSportInfo(log.sport);
            return {
                id            : log.id,
                sport         : log.sport,
                sportLabel    : info.label,
                sportIcon     : info.icon,
                intensity     : log.intensity,
                intensityLabel: INTENSITY_LABELS[log.intensity] || log.intensity,
                duration      : log.duration,
                caloriesBurned: log.caloriesBurned,
                date          : log.date,
            };
        });

        const totalBurned = Math.round(logsWithInfo.reduce((sum, l) => sum + l.caloriesBurned, 0));

        res.render('exercise/index', {
            title        : 'Nhật Ký Luyện Tập',
            activePage   : 'exercise',
            user,
            date,
            today,
            logs         : logsWithInfo,
            totalBurned,
            sports       : getSupportedSports(),
            intensityLabels: INTENSITY_LABELS,
            error        : null,
            success      : null,
        });
    } catch (err) {
        console.error('getExercise error:', err);
        res.status(500).render('404', { title: 'Lỗi hệ thống' });
    }
};

// ─── POST /luyen-tap/them ─────────────────────────────────────────────────────
exports.addExercise = async (req, res) => {
    try {
        const { sport, duration, date } = req.body;
        const user = req.user;

        // Validate
        if (!sport || !duration) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn môn và nhập số phút.' });
        }

        const durationNum = parseInt(duration);
        if (isNaN(durationNum) || durationNum < 1 || durationNum > 600) {
            return res.status(400).json({ success: false, message: 'Thời gian không hợp lệ (1–600 phút).' });
        }

        const entryDate = toDateString(date);
        const today     = toLocalDateString(new Date());
        if (entryDate > today) {
            return res.status(400).json({ success: false, message: 'Không thể ghi nhật ký cho ngày tương lai.' });
        }

        // Lấy cân nặng từ profile (fallback 60kg nếu chưa có)
        const weightKg = parseFloat(user.weight) || 60;

        const caloriesBurned = calculateExerciseCalories(sport, durationNum, weightKg);
        if (caloriesBurned === 0) {
            return res.status(400).json({ success: false, message: 'Môn thể thao không hợp lệ.' });
        }

        const log = await ExerciseLog.create({
            userId: user.id,
            sport,
            intensity: 'moderate',
            duration: durationNum,
            caloriesBurned,
            date: entryDate,
        });

        const info = getSportInfo(sport);
        return res.json({
            success: true,
            message: `Đã ghi nhận ${durationNum} phút ${info.label}!`,
            log: {
                id            : log.id,
                sport,
                sportLabel    : info.label,
                sportIcon     : info.icon,
                duration      : durationNum,
                caloriesBurned,
                date          : entryDate,
            },
        });
    } catch (err) {
        console.error('addExercise error:', err);
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ success: false, message: err.errors[0].message });
        }
        return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra.' });
    }
};

// ─── DELETE /luyen-tap/xoa/:id ────────────────────────────────────────────────
exports.deleteExercise = async (req, res) => {
    try {
        const log = await ExerciseLog.findOne({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!log) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục luyện tập.' });
        }

        await log.destroy();
        return res.json({ success: true, message: 'Đã xóa mục luyện tập.' });
    } catch (err) {
        console.error('deleteExercise error:', err);
        return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra.' });
    }
};

// ─── GET /luyen-tap/api/hom-nay ──────────────────────────────────────────────
// API JSON trả tổng calo đốt hôm nay (dùng cho Dashboard & Diary AJAX)
exports.getTodaySummary = async (req, res) => {
    try {
        const today = toLocalDateString(new Date());
        const logs  = await ExerciseLog.findAll({
            where: { userId: req.user.id, date: today },
            attributes: ['caloriesBurned'],
        });
        const totalBurned = Math.round(logs.reduce((sum, l) => sum + l.caloriesBurned, 0));
        return res.json({ success: true, totalBurned });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
};

// ─── Helper export: lấy tổng calo đốt theo ngày (dùng bởi diary/dashboard controller) ──
exports.getTotalBurnedByDate = async (userId, date) => {
    const logs = await ExerciseLog.findAll({
        where: { userId, date },
        attributes: ['caloriesBurned'],
    });
    return Math.round(logs.reduce((sum, l) => sum + l.caloriesBurned, 0));
};
