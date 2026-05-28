'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/api/water.controller.js
// Lớp mỏng: nhận request → gọi water.service → trả JSON.
// ═══════════════════════════════════════════════════════════════════════════════

const {
    addWaterLog,
    deleteWaterLog,
    updateWaterGoal,
} = require('../../services/water.service');

// ─── POST /api/v1/water ──────────────────────────────────────────────────────
exports.addWater = async (req, res) => {
    try {
        const result = await addWaterLog(req.user.id, req.body);
        return res.success({
            message   : `Đã ghi +${result.waterLog.amount} ml nước!`,
            waterLog  : result.waterLog,
            todayTotal: result.todayTotal,
        });
    } catch (err) {
        if (err.status) return res.error(err.message, err.status);
        if (err.name === 'SequelizeValidationError') return res.error(err.errors[0].message, 400);
        console.error('[API] addWater error:', err);
        return res.error('Đã có lỗi xảy ra. Vui lòng thử lại.', 500);
    }
};

// ─── DELETE /api/v1/water/:id ────────────────────────────────────────────────
exports.deleteWater = async (req, res) => {
    try {
        const result = await deleteWaterLog(req.user.id, req.params.id);
        return res.success({ message: 'Đã xóa mục nhật ký nước.', todayTotal: result.todayTotal });
    } catch (err) {
        if (err.status) return res.error(err.message, err.status);
        console.error('[API] deleteWater error:', err);
        return res.error('Đã có lỗi xảy ra. Vui lòng thử lại.', 500);
    }
};

// ─── PUT /api/v1/water/goal ──────────────────────────────────────────────────
exports.updateWaterGoal = async (req, res) => {
    try {
        const result = await updateWaterGoal(req.user, req.body.waterGoal);
        return res.success({
            message: `Đã cập nhật mục tiêu nước thành ${result.newGoal} ml/ngày!`,
            newGoal: result.newGoal,
        });
    } catch (err) {
        if (err.status) return res.error(err.message, err.status);
        console.error('[API] updateWaterGoal error:', err);
        return res.error('Đã có lỗi xảy ra. Vui lòng thử lại.', 500);
    }
};
