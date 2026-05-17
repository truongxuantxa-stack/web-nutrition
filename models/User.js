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
    waterGoal: {
        // Mục tiêu nước uống mỗi ngày (ml)
        // Tính theo công thức: weight (kg) × 35 ml (y khoa cơ bản)
        // VD: 45kg → 1575ml | 70kg → 2450ml | 80kg → 2800ml
        // Giá trị null = chưa thiết lập (user chưa có cân nặng)
        // User có thể ghi đè qua API PUT /nuoc/muc-tieu
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [100],  msg: 'Mục tiêu nước tối thiểu 100 ml.' },
            max: { args: [10000], msg: 'Mục tiêu nước tối đa 10000 ml.' },
        },
    },
    avatarUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
    },
    macroProtein: {
        // Tỷ lệ Protein (%) do user tự chỉnh.
        // null = chưa thiết lập → service fallback về mặc định 30%
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [5],  msg: 'Protein tối thiểu 5%.' },
            max: { args: [70], msg: 'Protein tối đa 70%.' },
        },
    },
    macroCarbs: {
        // Tỷ lệ Carbs (%) do user tự chỉnh.
        // null = chưa thiết lập → service fallback về mặc định 40%
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [5],  msg: 'Carbs tối thiểu 5%.' },
            max: { args: [80], msg: 'Carbs tối đa 80%.' },
        },
    },
    macroFat: {
        // Tỷ lệ Fat (%) do user tự chỉnh.
        // null = chưa thiết lập → service fallback về mặc định 30%
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [5],  msg: 'Fat tối thiểu 5%.' },
            max: { args: [70], msg: 'Fat tối đa 70%.' },
        },
    },
    adaptiveTDEE: {
        // TDEE thích ứng mới nhất tính toán được
        // null = chưa đủ dữ liệu để tính
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    useAdaptiveTDEE: {
        // Cờ bật/tắt sử dụng TDEE thích ứng (mặc định bật)
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'users',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['email'] },
    ],
});

module.exports = User;
