'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/weight.controller.js
// Xử lý theo dõi cân nặng: xem lịch sử, thêm log, xóa log
// ═══════════════════════════════════════════════════════════════════════════════

const { WeightLog } = require('../models');
const { calculateBMI, classifyBMI } = require('../services/nutrition.service');

// ─── GET /can-nang ─────────────────────────────────────────────────────────────

exports.getWeightPage = async (req, res) => {
    try {
        const user = req.user;

        // Lấy 90 ngày gần nhất
        const logs = await WeightLog.findAll({
            where  : { userId: user.id },
            order  : [['date', 'DESC']],
            limit  : 90,
        });

        // Tính BMI hiện tại (theo cân nặng mới nhất trong log, hoặc user.weight)
        const currentWeight = logs.length > 0 ? logs[0].weight : user.weight;
        const currentBMI    = calculateBMI(currentWeight, user.height);
        const bmiClass      = classifyBMI(currentBMI);

        // Dữ liệu cho biểu đồ (từ cũ đến mới)
        const chartData = [...logs].reverse().map(log => ({
            date  : log.date,
            weight: log.weight,
        }));

        // Thống kê: min, max, trung bình trong 30 ngày gần nhất
        const recent30 = logs.slice(0, 30);
        const stats = recent30.length > 0 ? {
            min : Math.min(...recent30.map(l => l.weight)),
            max : Math.max(...recent30.map(l => l.weight)),
            avg : Math.round((recent30.reduce((s, l) => s + l.weight, 0) / recent30.length) * 10) / 10,
            count: recent30.length,
        } : null;

        // Xu hướng: so sánh log mới nhất vs log cũ nhất trong 30 ngày
        let trend = null;
        if (recent30.length >= 2) {
            const diff = recent30[0].weight - recent30[recent30.length - 1].weight;
            trend = { diff: Math.round(diff * 10) / 10, direction: diff < 0 ? 'down' : diff > 0 ? 'up' : 'same' };
        }

        res.render('weight/index', {
            title        : 'Theo Dõi Cân Nặng',
            activePage   : 'weight',
            user,
            logs,
            currentWeight,
            currentBMI,
            bmiClass,
            chartData    : JSON.stringify(chartData),
            stats,
            trend,
            error        : req.query.error || null,   // nhận error code từ redirect
            success      : req.query.success || null,
        });
    } catch (err) {
        console.error('getWeightPage error:', err);
        res.status(500).render('404', { title: 'Lỗi hệ thống' });
    }
};

// ─── POST /can-nang/them ───────────────────────────────────────────────────────

exports.addWeight = async (req, res) => {
    const { weight, date, note } = req.body;
    const user = req.user;

    try {
        if (!weight || !date) {
            return res.redirect('/can-nang?error=missing');
        }

        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum < 10 || weightNum > 500) {
            return res.redirect('/can-nang?error=invalid_weight');
        }

        // [D1 FIX] Dùng findOrCreate để tránh race condition
        // Nếu 2 request đồng thời cùng ngày → chỉ 1 create thành công, cái kia sẽ find
        const [weightRecord, created] = await WeightLog.findOrCreate({
            where: { userId: user.id, date },
            defaults: {
                weight: weightNum,
                note: note ? note.trim() : null,
            },
        });

        // Nếu đã tồn tại (findOrCreate trả created=false) → update
        if (!created) {
            await weightRecord.update({
                weight: weightNum,
                note: note ? note.trim() : null,
            });
        }

        // Cập nhật cân nặng hiện tại vào User (log mới nhất)
        const latestLog = await WeightLog.findOne({
            where: { userId: user.id },
            order: [['date', 'DESC']],
        });
        if (latestLog) {
            await user.update({ weight: latestLog.weight });
        }

        return res.redirect('/can-nang?success=1');
    } catch (err) {
        console.error('addWeight error:', err);
        return res.redirect('/can-nang?error=server');
    }
};

// ─── DELETE /can-nang/xoa/:id ─────────────────────────────────────────────────

exports.deleteWeight = async (req, res) => {
    try {
        const log = await WeightLog.findOne({
            where: {
                id    : req.params.id,
                userId: req.user.id,
            },
        });

        if (!log) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy log cân nặng.' });
        }

        await log.destroy();

        return res.json({ success: true, message: 'Đã xóa log cân nặng.' });
    } catch (err) {
        console.error('deleteWeight error:', err);
        return res.status(500).json({ success: false, message: 'Đã có lỗi xảy ra.' });
    }
};
