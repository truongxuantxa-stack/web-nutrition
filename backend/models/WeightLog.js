'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeightLog = sequelize.define('WeightLog', {
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
    weight: {
        // Cân nặng (kg) được ghi nhận
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            min: { args: [10], msg: 'Cân nặng tối thiểu 10 kg.' },
            max: { args: [500], msg: 'Cân nặng tối đa 500 kg.' },
            notNull: { msg: 'Cân nặng không được để trống.' },
        },
    },
    date: {
        // Ngày ghi cân (YYYY-MM-DD)
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: { msg: 'Ngày không hợp lệ.' },
            notNull: { msg: 'Ngày không được để trống.' },
        },
    },
    note: {
        // Ghi chú: cảm giác hôm đó, tập gym, ...
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'weight_logs',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'date'] },
        // Mỗi người dùng chỉ có 1 log cân nặng mỗi ngày
        { unique: true, fields: ['userId', 'date'], name: 'unique_user_date_weight' },
    ],
});

module.exports = WeightLog;
