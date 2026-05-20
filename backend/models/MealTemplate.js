'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MealTemplate = sequelize.define('MealTemplate', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Tên template không được để trống.' },
        },
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    slots: {
        // Lưu mảng JSON định nghĩa 4 slot: Carb, Protein, Fiber, Fat
        type: DataTypes.JSON,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'meal_templates',
    timestamps: true,
});

module.exports = MealTemplate;
