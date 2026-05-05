'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiaryEntry = sequelize.define('DiaryEntry', {
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
    foodId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: 'foods',
            key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
    },
    amount: {
        // Số lượng (đơn vị tính theo Food.unit). Ví dụ: 1.5 (tức 1.5 bát)
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: { args: [0.01], msg: 'Số lượng phải lớn hơn 0.' },
        },
    },
    mealType: {
        // Loại bữa ăn trong ngày
        type: DataTypes.ENUM(
            'sang',     // Bữa sáng
            'trua',     // Bữa trưa
            'toi',      // Bữa tối
            'phu'       // Bữa phụ / ăn vặt
        ),
        allowNull: false,
        defaultValue: 'sang',
    },
    date: {
        // Ngày ghi nhật ký (YYYY-MM-DD)
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: 'Ngày không hợp lệ.' },
        },
    },
    // Lưu snapshot dinh dưỡng tại thời điểm ghi để tránh thay đổi nếu Food bị sửa
    caloriesSnapshot: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    proteinSnapshot: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    carbsSnapshot: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    fatSnapshot: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    note: {
        // Ghi chú tùy ý của người dùng
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'diary_entries',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'date'] },
        { fields: ['userId', 'mealType', 'date'] },
        { fields: ['foodId'] },
    ],
});

module.exports = DiaryEntry;
