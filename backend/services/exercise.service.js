'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/exercise.service.js
// Tính calo đốt khi luyện tập dựa trên MET (Metabolic Equivalent of Task)
// Công thức: Calo = MET × Cân nặng (kg) × Thời gian (giờ)
// ═══════════════════════════════════════════════════════════════════════════════

const { ExerciseLog }                    = require('../models');
const { toLocalDateString, toDateString } = require('../utils/date.helper');

// ─── Bảng MET theo môn ───────────────────────────────────────────────────────
// Nguồn tham khảo: Compendium of Physical Activities (Ainsworth et al.)
// defaultMet = MET ở cường độ trung bình (moderate), dùng làm mặc định khi tính calo
const MET_TABLE = {
    walking_slow: {
        label: 'Đi bộ chậm',
        icon: '🚶',
        defaultMet: 2.5,   // ~3–4 km/h
    },
    walking: {
        label: 'Đi bộ',
        icon: '🚶',
        defaultMet: 3.5,   // ~5 km/h
    },
    walking_fast: {
        label: 'Đi bộ nhanh',
        icon: '🚶‍♂️',
        defaultMet: 4.5,   // ~6–7 km/h
    },
    running_slow: {
        label: 'Chạy bộ nhẹ',
        icon: '🏃',
        defaultMet: 6.0,   // ~7–8 km/h
    },
    running: {
        label: 'Chạy bộ',
        icon: '🏃',
        defaultMet: 8.3,   // ~9–11 km/h
    },
    running_fast: {
        label: 'Chạy bộ nhanh',
        icon: '🏃‍♂️',
        defaultMet: 11.0,  // >12 km/h
    },
    cycling_slow: {
        label: 'Đạp xe nhẹ',
        icon: '🚴',
        defaultMet: 4.0,   // <16 km/h
    },
    cycling: {
        label: 'Đạp xe',
        icon: '🚴',
        defaultMet: 6.8,   // 16–22 km/h
    },
    cycling_fast: {
        label: 'Đạp xe nhanh',
        icon: '🚴‍♂️',
        defaultMet: 10.0,  // >22 km/h
    },
    swimming: {
        label: 'Bơi lội',
        icon: '🏊',
        defaultMet: 7.0,
    },
    badminton: {
        label: 'Cầu lông',
        icon: '🏸',
        defaultMet: 5.5,
    },
    tennis: {
        label: 'Tennis',
        icon: '🎾',
        defaultMet: 6.0,
    },
    pickleball: {
        label: 'Pickleball',
        icon: '🏓',
        defaultMet: 5.5,
    },
    football: {
        label: 'Bóng đá',
        icon: '⚽',
        defaultMet: 7.0,
    },
    basketball: {
        label: 'Bóng rổ',
        icon: '🏀',
        defaultMet: 6.5,
    },
    gym: {
        label: 'Gym (Tập tạ)',
        icon: '🏋️',
        defaultMet: 5.0,
    },
    gym_heavy: {
        label: 'Gym nặng (Powerlifting)',
        icon: '🏋️',
        defaultMet: 6.0,
    },
    yoga: {
        label: 'Yoga',
        icon: '🧘',
        defaultMet: 3.0,
    },
    pilates: {
        label: 'Pilates',
        icon: '🤸',
        defaultMet: 3.5,
    },
    dancing: {
        label: 'Nhảy / Zumba',
        icon: '🕺',
        defaultMet: 6.0,
    },
    boxing: {
        label: 'Boxing / Muay Thái',
        icon: '🥊',
        defaultMet: 9.0,
    },
};



// ─── Lấy danh sách môn thể thao (dùng cho dropdown UI) ───────────────────────
const getSupportedSports = (weightKg = 60) => {
    return Object.entries(MET_TABLE).map(([key, val]) => ({
        key,
        label          : val.label,
        icon           : val.icon,
        defaultMet     : val.defaultMet,
        caloriesPerHour: Math.round(val.defaultMet * weightKg),
    }));
};

// ─── Tính calo đốt theo MET mặc định (moderate) ──────────────────────────────
// @param {string} sport       - key môn thể thao (ví dụ: 'running')
// @param {number} duration    - phút luyện tập
// @param {number} weightKg    - cân nặng người dùng (kg)
// @returns {number}           - calo đốt (kcal), làm tròn đến 1 chữ số thập phân
const calculateExerciseCalories = (sport, duration, weightKg) => {
    const sportData = MET_TABLE[sport];
    if (!sportData) return 0;
    const hours = duration / 60;
    return Math.round(sportData.defaultMet * weightKg * hours * 10) / 10;
};

// Alias giữ nguyên để không phá vỡ code cũ (nếu có nơi khác dùng)
const calculateExerciseCaloriesDefault = calculateExerciseCalories;

// ─── Lấy thông tin chi tiết 1 môn (label, icon) ──────────────────────────────
const getSportInfo = (sportKey) => {
    const sport = MET_TABLE[sportKey];
    if (!sport) return { label: sportKey, icon: '🏅' };
    return { label: sport.label, icon: sport.icon };
};

// ─── Lấy tổng calo đốt theo ngày (dùng bởi diary, dashboard) ────────────────
const getTotalBurnedByDate = async (userId, date) => {
    const logs = await ExerciseLog.findAll({
        where     : { userId, date },
        attributes: ['caloriesBurned'],
    });
    return Math.round(logs.reduce((sum, l) => sum + l.caloriesBurned, 0));
};

/**
 * Validate và tạo ExerciseLog mới.
 * @param {number} userId
 * @param {{ sport, duration, date }} payload
 * @param {number} weightKg - cân nặng user (kg)
 * @returns {{ log: object }}
 * @throws {{ status: number, message: string }}
 */
const addExerciseLog = async (userId, { sport, duration, date }, weightKg) => {
    if (!sport || !duration) {
        throw { status: 400, message: 'Vui lòng chọn môn và nhập số phút.' };
    }

    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 600) {
        throw { status: 400, message: 'Thời gian không hợp lệ (1–600 phút).' };
    }

    const entryDate = toDateString(date);
    const today     = toLocalDateString(new Date());
    if (entryDate > today) {
        throw { status: 400, message: 'Không thể ghi nhật ký cho ngày tương lai.' };
    }

    const caloriesBurned = calculateExerciseCalories(sport, durationNum, weightKg || 60);
    if (caloriesBurned === 0) {
        throw { status: 400, message: 'Môn thể thao không hợp lệ.' };
    }

    const log  = await ExerciseLog.create({ userId, sport, duration: durationNum, caloriesBurned, date: entryDate });
    const info = getSportInfo(sport);
    return {
        log: {
            id            : log.id,
            sport,
            sportLabel    : info.label,
            sportIcon     : info.icon,
            duration      : durationNum,
            caloriesBurned,
            date          : entryDate,
        },
    };
};

/**
 * Tìm và xóa ExerciseLog.
 * @param {number} userId
 * @param {number} logId
 * @throws {{ status: number, message: string }}
 */
const deleteExerciseLog = async (userId, logId) => {
    const log = await ExerciseLog.findOne({ where: { id: logId, userId } });
    if (!log) {
        throw { status: 404, message: 'Không tìm thấy mục luyện tập.' };
    }
    await log.destroy();
};

module.exports = {
    getSupportedSports,
    calculateExerciseCalories,
    calculateExerciseCaloriesDefault,
    getSportInfo,
    getTotalBurnedByDate,
    addExerciseLog,
    deleteExerciseLog,
    MET_TABLE,
};
