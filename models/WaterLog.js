'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// models/WaterLog.js
// Theo dõi lượng nước uống hàng ngày.
// Chỉ dành cho nước lọc/khoáng — đồ uống có calo nhập vào DiaryEntry.
// ═══════════════════════════════════════════════════════════════════════════════

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WaterLog = sequelize.define('WaterLog', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    amount: {
        // Lượng nước (ml)
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1],    msg: 'Lượng nước tối thiểu 1 ml.' },
            max: { args: [5000], msg: 'Lượng nước tối đa 5000 ml mỗi lần.' },
            notNull: { msg: 'Lượng nước không được để trống.' },
        },
    },
    date: {
        // Ngày ghi log (YYYY-MM-DD) — dùng để query nhanh theo ngày
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: 'Ngày không hợp lệ.' },
            notNull: { msg: 'Ngày không được để trống.' },
        },
    },
    note: {
        // Ghi chú ngắn (VD: "trước bữa trưa", "sau tập gym")
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
    // Giờ uống → dùng createdAt (Sequelize tự quản lý), không cần trường time riêng
}, {
    tableName: 'water_logs',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'date'] }, // Truy vấn nhanh theo user + ngày
    ],
});

module.exports = WaterLog;
