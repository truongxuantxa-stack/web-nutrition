'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserMealConfig = sequelize.define('UserMealConfig', {
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
    meals: {
        // Lưu cấu hình bữa ăn JSON (vd: sáng 25%, trưa 35%, tối 30%, phụ 10%)
        type: DataTypes.JSON,
        allowNull: false,
    },
}, {
    tableName: 'user_meal_configs',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['userId'] } // 1 user chỉ có 1 config
    ],
});

module.exports = UserMealConfig;
