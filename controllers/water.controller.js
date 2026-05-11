'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/water.controller.js
// Theo dõi lượng nước uống: thêm log, xóa log, cập nhật mục tiêu.
// ═══════════════════════════════════════════════════════════════════════════════

const { WaterLog } = require('../models');
const { Op }       = require('sequelize');

// ─── Helper: Format ngày YYYY-MM-DD theo local timezone ──────────────────────
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

// ─── Helper export: Tính tổng nước uống theo ngày ────────────────────────────
/**
 * Trả về tổng ml nước uống trong ngày + danh sách logs.
 * Dùng chung cho diary controller và dashboard controller.
 *
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @returns {{ total: number, logs: WaterLog[] }}
 */
exports.getWaterByDate = async (userId, date) => {
    const logs = await WaterLog.findAll({
        where: { userId, date },
        order: [['createdAt', 'ASC']],
    });
    const total = logs.reduce((sum, l) => sum + l.amount, 0);
    return { total, logs };
};

// ─── POST /nuoc/them ─────────────────────────────────────────────────────────

exports.addWater = async (req, res) => {
    const { amount, date, note } = req.body;
    const user = req.user;

    try {
        // [QA-FIX] Dùng Number() thay vì parseInt để chặn cả dạng "5abc" (parseInt("5abc") = 5, lột qua)
        const amountRaw = Number(amount);
        if (
            amount === undefined || amount === null || String(amount).trim() === '' ||
            isNaN(amountRaw) ||
            !Number.isInteger(amountRaw) ||
            amountRaw <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Lượng nước phải là số nguyên dương (ml).',
            });
        }
        const amountNum = amountRaw;
        if (amountNum > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Lượng nước tối đa mỗi lần nhập là 5000 ml.',
            });
        }

        const logDate = toDateString(date);

        // Không cho ghi nước cho ngày tương lai
        const today = toLocalDateString(new Date());
        if (logDate > today) {
            return res.status(400).json({
                success: false,
                message: 'Không thể ghi nhật ký nước cho ngày tương lai.',
            });
        }

        const waterLog = await WaterLog.create({
            userId  : user.id,
            amount  : amountNum,
            date    : logDate,
            note    : note ? note.trim().slice(0, 255) : null,
        });

        // Tính lại tổng nước hôm nay sau khi thêm
        const { total: todayTotal } = await exports.getWaterByDate(user.id, logDate);

        return res.json({
            success: true,
            message: `Đã ghi +${amountNum} ml nước!`,
            waterLog: {
                id       : waterLog.id,
                amount   : waterLog.amount,
                note     : waterLog.note,
                createdAt: waterLog.createdAt,
            },
            todayTotal,
        });
    } catch (err) {
        console.error('addWater error:', err);
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ success: false, message: err.errors[0].message });
        }
        return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra. Vui lòng thử lại.' });
    }
};

// ─── DELETE /nuoc/xoa/:id ────────────────────────────────────────────────────

exports.deleteWater = async (req, res) => {
    try {
        const log = await WaterLog.findOne({
            where: {
                id    : req.params.id,
                userId: req.user.id, // Chỉ cho phép xóa log của chính mình
            },
        });

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy mục nhật ký nước.',
            });
        }

        const logDate = log.date;
        await log.destroy();

        // Tính lại tổng nước sau khi xóa
        const { total: todayTotal } = await exports.getWaterByDate(req.user.id, logDate);

        return res.json({
            success: true,
            message: 'Đã xóa mục nhật ký nước.',
            todayTotal,
        });
    } catch (err) {
        console.error('deleteWater error:', err);
        return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra. Vui lòng thử lại.' });
    }
};

// ─── PUT /nuoc/muc-tieu ──────────────────────────────────────────────────────
// Cho phép user ghi đè waterGoal tính từ cân nặng nếu muốn số tùy chỉnh

exports.updateWaterGoal = async (req, res) => {
    try {
        const { waterGoal } = req.body;
        // [QA-FIX] Dùng Number() để chặn cả dạng "500abc". Min 500ml (thực tế hơn 100ml)
        const goalRaw = Number(waterGoal);
        const goalNum = Number.isInteger(goalRaw) ? goalRaw : Math.round(goalRaw);

        if (
            waterGoal === undefined || waterGoal === null || String(waterGoal).trim() === '' ||
            isNaN(goalNum) || goalNum < 500 || goalNum > 10000
        ) {
            return res.status(400).json({
                success: false,
                message: 'Mục tiêu nước phải từ 500 ml đến 10000 ml.',
            });
        }

        await req.user.update({ waterGoal: goalNum });

        return res.json({
            success  : true,
            message  : `Đã cập nhật mục tiêu nước thành ${goalNum} ml/ngày!`,
            newGoal  : goalNum,
        });
    } catch (err) {
        console.error('updateWaterGoal error:', err);
        return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra. Vui lòng thử lại.' });
    }
};
