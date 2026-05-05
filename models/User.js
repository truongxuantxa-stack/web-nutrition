'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Họ tên không được để trống.' },
            len: { args: [2, 100], msg: 'Họ tên phải từ 2 đến 100 ký tự.' },
        },
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: { name: 'unique_email', msg: 'Email đã tồn tại.' },
        validate: {
            isEmail: { msg: 'Email không hợp lệ.' },
            notEmpty: { msg: 'Email không được để trống.' },
        },
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Mật khẩu không được để trống.' },
        },
    },
    gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: true,
        defaultValue: null,
    },
    birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: null,
        validate: {
            isDate: { msg: 'Ngày sinh không hợp lệ.' },
        },
    },
    height: {
        // Chiều cao (cm)
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [50], msg: 'Chiều cao tối thiểu 50 cm.' },
            max: { args: [300], msg: 'Chiều cao tối đa 300 cm.' },
        },
    },
    weight: {
        // Cân nặng (kg)
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [10], msg: 'Cân nặng tối thiểu 10 kg.' },
            max: { args: [500], msg: 'Cân nặng tối đa 500 kg.' },
        },
    },
    activityLevel: {
        // Mức hoạt động thể chất
        type: DataTypes.ENUM(
            'sedentary',    // Ít vận động (x1.2)
            'light',        // Nhẹ 1-3 ngày/tuần (x1.375)
            'moderate',     // Vừa 3-5 ngày/tuần (x1.55)
            'active',       // Nhiều 6-7 ngày/tuần (x1.725)
            'very_active'   // Rất nhiều / vận động viên (x1.9)
        ),
        allowNull: true,
        defaultValue: null,
    },
    goal: {
        // Mục tiêu sức khỏe
        type: DataTypes.ENUM(
            'lose_weight',      // Giảm cân
            'maintain_weight',  // Duy trì cân nặng
            'gain_weight'       // Tăng cân / tăng cơ
        ),
        allowNull: true,
        defaultValue: null,
    },
    isOnboarded: {
        // Đánh dấu người dùng đã hoàn thành onboarding
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    avatarUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'users',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['email'] },
    ],
});

module.exports = User;
