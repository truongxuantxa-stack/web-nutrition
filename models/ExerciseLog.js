'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExerciseLog = sequelize.define('ExerciseLog', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    sport: {
        // Key môn thể thao (ví dụ: 'running', 'badminton')
        type: DataTypes.STRING(50),
        allowNull: false,
    },

    duration: {
        // Thời gian luyện tập (phút)
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Thời gian phải ít nhất 1 phút.' },
            max: { args: [600], msg: 'Thời gian tối đa 600 phút.' },
        },
    },
    caloriesBurned: {
        // Calo đốt (tính từ MET × cân nặng × giờ)
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
}, {
    tableName: 'exercise_logs',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'date'] },
    ],
});

module.exports = ExerciseLog;
