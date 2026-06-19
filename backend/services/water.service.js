'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/water.service.js
// Business logic cho tính năng theo dõi nước uống.
// Bóc tách từ controllers/water.controller.js (legacy EJS).
// ═══════════════════════════════════════════════════════════════════════════════

const { WaterLog } = require('../models');
const { toLocalDateString, toDateString } = require('../utils/date.helper');

/**
 * Lấy tổng lượng nước uống + danh sách logs theo ngày.
 * Dùng chung cho diary, dashboard và water API controller.
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @returns {{ total: number, logs: WaterLog[] }}
 */
const getWaterByDate = async (userId, date) => {
    const logs = await WaterLog.findAll({
        where     : { userId, date },
        attributes: ['id', 'amount', 'note', 'createdAt'],
        order     : [['createdAt', 'ASC']],
    });
    const total = logs.reduce((sum, l) => sum + l.amount, 0);
    return { total, logs };
};

/**
 * Validate và tạo WaterLog mới.
 * @param {number} userId
 * @param {{ amount, date, note }} payload
 * @returns {{ waterLog: object, todayTotal: number }}
 * @throws {{ status: number, message: string }}
 */
const addWaterLog = async (userId, { amount, date, note }) => {
    // [QA-FIX] Dùng Number() thay vì parseInt để chặn cả dạng "5abc"
    const amountRaw = Number(amount);
    if (
        amount === undefined || amount === null || String(amount).trim() === '' ||
        isNaN(amountRaw) ||
        !Number.isInteger(amountRaw) ||
        amountRaw <= 0
    ) {
        throw { status: 400, message: 'Lượng nước phải là số nguyên dương (ml).' };
    }
    if (amountRaw > 5000) {
        throw { status: 400, message: 'Lượng nước tối đa mỗi lần nhập là 5000 ml.' };
    }

    const logDate = toDateString(date);
    const today   = toLocalDateString(new Date());
    if (logDate > today) {
        throw { status: 400, message: 'Không thể ghi nhật ký nước cho ngày tương lai.' };
    }

    const waterLog = await WaterLog.create({
        userId,
        amount : amountRaw,
        date   : logDate,
        note   : note ? note.trim().slice(0, 255) : null,
    });

    const { total: todayTotal } = await getWaterByDate(userId, logDate);
    return {
        waterLog: {
            id       : waterLog.id,
            amount   : waterLog.amount,
            note     : waterLog.note,
            createdAt: waterLog.createdAt,
        },
        todayTotal,
    };
};

/**
 * Tìm và xóa WaterLog, trả về tổng nước còn lại.
 * @param {number} userId
 * @param {number} logId
 * @returns {{ todayTotal: number }}
 * @throws {{ status: number, message: string }}
 */
const deleteWaterLog = async (userId, logId) => {
    const log = await WaterLog.findOne({ where: { id: logId, userId } });
    if (!log) {
        throw { status: 404, message: 'Không tìm thấy mục nhật ký nước.' };
    }

    const logDate = log.date;
    await log.destroy();

    const { total: todayTotal } = await getWaterByDate(userId, logDate);
    return { todayTotal };
};

/**
 * Validate và cập nhật mục tiêu nước uống hàng ngày của user.
 * @param {object} user - Sequelize User instance
 * @param {*} waterGoal
 * @returns {{ newGoal: number }}
 * @throws {{ status: number, message: string }}
 */
const updateWaterGoal = async (user, waterGoal) => {
    // Dùng Number() để chặn "500abc", reject float để nhất quán với addWaterLog
    const goalRaw = Number(waterGoal);

    if (
        waterGoal === undefined || waterGoal === null || String(waterGoal).trim() === '' ||
        isNaN(goalRaw) ||
        !Number.isInteger(goalRaw) ||
        goalRaw < 500 || goalRaw > 10000
    ) {
        throw { status: 400, message: 'Mục tiêu nước phải là số nguyên từ 500 ml đến 10000 ml.' };
    }

    await user.update({ waterGoal: goalRaw });
    return { newGoal: goalRaw };
};

module.exports = { getWaterByDate, addWaterLog, deleteWaterLog, updateWaterGoal };
