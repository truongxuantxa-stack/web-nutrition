'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Food = sequelize.define('Food', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        // Tên món ăn (tiếng Việt)
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Tên món ăn không được để trống.' },
            len: { args: [1, 200], msg: 'Tên món ăn tối đa 200 ký tự.' },
        },
    },
    calories: {
        // Năng lượng (kcal) trên 1 đơn vị
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Calories không thể âm.' },
        },
    },
    protein: {
        // Đạm (g) trên 1 đơn vị
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Protein không thể âm.' },
        },
    },
    carbs: {
        // Tinh bột (g) trên 1 đơn vị
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Carbs không thể âm.' },
        },
    },
    fat: {
        // Chất béo (g) trên 1 đơn vị
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Fat không thể âm.' },
        },
    },
    unit: {
        // Đơn vị tính (ví dụ: "100g", "1 tô", "1 bát", "1 ly")
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '100g',
        validate: {
            notEmpty: { msg: 'Đơn vị không được để trống.' },
        },
    },
    category: {
        // Phân loại món ăn
        type: DataTypes.ENUM(
            'com',          // Cơm & Xôi
            'pho_bun',      // Phở, Bún, Mì
            'banh',         // Bánh mặn, bánh ngọt
            'rau_cu',       // Rau củ
            'thit_ca',      // Thịt & Cá
            'do_uong',      // Đồ uống
            'trai_cay',     // Trái cây
            'khac'          // Khác
        ),
        allowNull: false,
        defaultValue: 'khac',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'foods',
    timestamps: true,
    indexes: [
        { fields: ['name'] },
        { fields: ['category'] },
    ],
});

module.exports = Food;
