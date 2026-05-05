'use strict';

const sequelize = require('../config/database');

// ── Import Models ─────────────────────────────────────────────────────────────
const User       = require('./User');
const Food       = require('./Food');
const DiaryEntry = require('./DiaryEntry');
const WeightLog  = require('./WeightLog');

// ── Associations ──────────────────────────────────────────────────────────────

// User <-> DiaryEntry  (1 user có nhiều nhật ký ăn uống)
User.hasMany(DiaryEntry, { foreignKey: 'userId', as: 'diaryEntries' });
DiaryEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Food <-> DiaryEntry  (1 món ăn xuất hiện trong nhiều nhật ký)
Food.hasMany(DiaryEntry, { foreignKey: 'foodId', as: 'diaryEntries' });
DiaryEntry.belongsTo(Food, { foreignKey: 'foodId', as: 'food' });

// User <-> WeightLog   (1 user có nhiều log cân nặng)
User.hasMany(WeightLog, { foreignKey: 'userId', as: 'weightLogs' });
WeightLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Sync & Export ─────────────────────────────────────────────────────────────
module.exports = {
    sequelize,
    User,
    Food,
    DiaryEntry,
    WeightLog,
};
