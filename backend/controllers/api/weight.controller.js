'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/api/weight.controller.js
// Wrap weight logic, trả JSON thay vì redirect
// ═══════════════════════════════════════════════════════════════════════════════

const { WeightLog }                    = require('../../models');
const { calculateBMI, classifyBMI }    = require('../../services/nutrition.service');

const toLocalDateStr = (d) => {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ─── GET /api/v1/weight ───────────────────────────────────────────────────────
exports.getWeight = async (req, res) => {
    try {
        const user = req.user;
        const logs = await WeightLog.findAll({
            where: { userId: user.id },
            order: [['date', 'DESC']],
            limit: 90,
        });

        const currentWeight = logs.length > 0 ? logs[0].weight : user.weight;
        const currentBMI    = calculateBMI(currentWeight, user.height);
        const bmiClass      = classifyBMI(currentBMI);

        const chartData = [...logs].reverse().map(l => ({ date: l.date, weight: l.weight }));

        const recent30 = logs.slice(0, 30);
        const stats = recent30.length > 0 ? {
            min  : Math.min(...recent30.map(l => l.weight)),
            max  : Math.max(...recent30.map(l => l.weight)),
            avg  : Math.round((recent30.reduce((s, l) => s + l.weight, 0) / recent30.length) * 10) / 10,
            count: recent30.length,
        } : null;

        let trend = null;
        if (recent30.length >= 2) {
            const diff = recent30[0].weight - recent30[recent30.length - 1].weight;
            trend = { diff: Math.round(diff * 10) / 10, direction: diff < 0 ? 'down' : diff > 0 ? 'up' : 'same' };
        }

        return res.success({
            logs: logs.map(l => ({
                id    : l.id,
                date  : l.date,
                weight: l.weight,
                note  : l.note,
            })),
            currentWeight,
            currentBMI,
            bmiClass,
            chartData,
            stats,
            trend,
        });
    } catch (err) {
        console.error('[API] getWeight error:', err);
        return res.error('Lỗi server.', 500);
    }
};

// ─── POST /api/v1/weight ─────────────────────────────────────────────────────
exports.addWeight = async (req, res) => {
    const { weight, date, note } = req.body;
    const user = req.user;

    try {
        if (!weight || !date) {
            return res.error('Vui lòng nhập đủ cân nặng và ngày.', 400);
        }
        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum < 10 || weightNum > 500) {
            return res.error('Cân nặng không hợp lệ (10–500 kg).', 400);
        }

        const today = toLocalDateStr(new Date());
        if (date > today) {
            return res.error('Không thể ghi cân nặng cho ngày tương lai.', 400);
        }

        const [weightRecord, created] = await WeightLog.findOrCreate({
            where   : { userId: user.id, date },
            defaults: { weight: weightNum, note: note ? note.trim() : null },
        });
        if (!created) {
            await weightRecord.update({ weight: weightNum, note: note ? note.trim() : null });
        }

        // Cập nhật cân nặng hiện tại vào User
        const latestLog = await WeightLog.findOne({
            where: { userId: user.id },
            order: [['date', 'DESC']],
        });
        if (latestLog) await user.update({ weight: latestLog.weight });

        return res.success({
            log: { id: weightRecord.id, date: weightRecord.date, weight: weightNum },
            created,
        }, created ? 'Đã ghi nhận cân nặng.' : 'Đã cập nhật cân nặng.');
    } catch (err) {
        console.error('[API] addWeight error:', err);
        return res.error('Lỗi server.', 500);
    }
};

// ─── DELETE /api/v1/weight/:id ────────────────────────────────────────────────
exports.deleteWeight = async (req, res) => {
    try {
        const log = await WeightLog.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!log) return res.error('Không tìm thấy log cân nặng.', 404);
        await log.destroy();
        return res.success(null, 'Đã xóa log cân nặng.');
    } catch (err) {
        console.error('[API] deleteWeight error:', err);
        return res.error('Lỗi server.', 500);
    }
};
