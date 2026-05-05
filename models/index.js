'use strict';

const sequelize = require('../config/database');

// ── Import Models ─────────────────────────────────────────────────────────────
const User       = require('./User');
const Food       = require('./Food');
const DiaryEntry = require('./DiaryEntry');
const WeightLog  = require('./WeightLog');

// ── Associations ──────────────────────────────────────────────────────────────

// User <-> DiaryEntry  (1 user có nhiều nhật ký ăn uống)
// onDelete: 'CASCADE' → xóa user thì xóa toàn bộ nhật ký của họ
User.hasMany(DiaryEntry, { foreignKey: 'userId', as: 'diaryEntries', onDelete: 'CASCADE', hooks: true });
DiaryEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Food <-> DiaryEntry  (1 món ăn xuất hiện trong nhiều nhật ký)
// onDelete: 'RESTRICT' → không cho xóa Food nếu vẫn còn DiaryEntry tham chiếu
Food.hasMany(DiaryEntry, { foreignKey: 'foodId', as: 'diaryEntries', onDelete: 'RESTRICT' });
DiaryEntry.belongsTo(Food, { foreignKey: 'foodId', as: 'food' });

// User <-> WeightLog   (1 user có nhiều log cân nặng)
// onDelete: 'CASCADE' → xóa user thì xóa toàn bộ weight log của họ
User.hasMany(WeightLog, { foreignKey: 'userId', as: 'weightLogs', onDelete: 'CASCADE', hooks: true });
WeightLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Sync & Export ─────────────────────────────────────────────────────────────
module.exports = {
    sequelize,
    User,
    Food,
    DiaryEntry,
    WeightLog,
};
