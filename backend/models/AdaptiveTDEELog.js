'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdaptiveTDEELog = sequelize.define('AdaptiveTDEELog', {
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
    weekStartDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    weekEndDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    avgDailyIntake: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    daysLogged: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    startWeight: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    endWeight: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    weightDelta: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    calculatedTDEE: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    rollingTDEE: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    staticTDEE: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    userGoal: {
        type: DataTypes.ENUM('lose_weight', 'maintain_weight', 'gain_weight'),
        allowNull: true,
    },
    targetCalories: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('applied', 'skipped_low_data', 'skipped_by_user', 'clamped'),
        allowNull: false,
        defaultValue: 'applied',
    },
    confidence: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'high',
    },
}, {
    tableName: 'adaptive_tdee_logs',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['userId', 'weekStartDate'], name: 'unique_user_week' },
        { fields: ['userId'] },
    ],
});

module.exports = AdaptiveTDEELog;
