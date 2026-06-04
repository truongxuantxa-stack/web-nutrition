'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Food = sequelize.define('Food', {
    // --- Custom Food Fields ---
    userId: {
        // null = Món hệ thống (seed), có giá trị = Món do user tự tạo
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
            model: 'users',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },
    isCustom: {
        // true = user tự tạo, false = food hệ thống
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
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
    fiber: {
        // Chất xơ (g) trên 1 đơn vị — quan trọng cho hệ tiêu hóa
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [0], msg: 'Fiber không thể âm.' },
        },
    },
    sugar: {
        // Đường tổng (g) trên 1 đơn vị — giúp kiểm soát nguy cơ tiểu đường
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [0], msg: 'Sugar không thể âm.' },
        },
    },
    sodium: {
        // Natri/Muối (mg) trên 1 đơn vị — quan trọng cho người có vấn đề huyết áp
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [0], msg: 'Sodium không thể âm.' },
        },
    },
    vitaminA: {
        // Vitamin A (µg RAE) trên 1 đơn vị
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [0], msg: 'Vitamin A không thể âm.' },
        },
    },
    vitaminC: {
        // Vitamin C (mg) trên 1 đơn vị
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [0], msg: 'Vitamin C không thể âm.' },
        },
    },
    calcium: {
        // Canxi (mg) trên 1 đơn vị
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [0], msg: 'Canxi không thể âm.' },
        },
    },
    iron: {
        // Sắt (mg) trên 1 đơn vị
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
        validate: {
            min: { args: [0], msg: 'Sắt không thể âm.' },
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
        // Phân loại món ăn theo nhóm thực phẩm
        type: DataTypes.ENUM(
            'com',          // Cơm & Xôi
            'pho_bun',      // Phở, Bún, Mì
            'banh',         // Bánh mặn, bánh ngọt
            'rau_cu',       // Rau củ
            'thit_ca',      // Thịt & Cá
            'do_uong',      // Đồ uống
            'trai_cay',     // Trái cây
            'protein',      // Nguyên liệu thô (Đạm)
            'carb',         // Nguyên liệu thô (Tinh bột)
            'fat',          // Nguyên liệu thô (Béo)
            'fiber',        // Nguyên liệu thô (Chất xơ / Rau củ)
            'vitamin',      // Nguyên liệu thô (Vitamin & Khoáng chất)
            'khac'          // Khác
        ),
        allowNull: false,
        defaultValue: 'khac',
    },
    foodType: {
        // Loại thực phẩm: 'raw' = nguyên liệu thô (tính/100g), 'dish' = món ăn chế biến (tính/phần ăn)
        type: DataTypes.ENUM('raw', 'dish'),
        allowNull: false,
        defaultValue: 'dish',
    },
    proteinProfile: {
        // Phân loại nguồn đạm (lean: nạc, moderate: vừa, fatty: mỡ)
        type: DataTypes.ENUM('lean', 'moderate', 'fatty'),
        allowNull: true,
        defaultValue: null,
    },
    tags: {
        // Nhãn phân loại concept ẩm thực (dùng cho MealTemplate filtering)
        // Ví dụ: ['traditional', 'healthy_bowl']
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
    },
    isSuggestable: {
        // true = thuật toán gợi ý có thể đề xuất món này; false = nguyên liệu thô/gia vị, không gợi ý
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    imageUrl: {
        // Đường dẫn hình ảnh món ăn
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
    },
    dataSource: {
        // Nguồn dữ liệu: 'local' = seed/manual, 'openfoodfacts' = từ API
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'local',
    },
    barcode: {
        // Mã vạch sản phẩm (EAN/UPC) — dùng cho barcode scanner
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'foods',
    timestamps: true,
    paranoid: true,  // Bật soft delete: Sequelize sẽ dùng deletedAt thay vì DELETE thật
    indexes: [
        { fields: ['name'] },
        { fields: ['category'] },
        { fields: ['foodType'] },
        { fields: ['isSuggestable'] },
        { fields: ['userId'] },
        { fields: ['isCustom'] },
        { fields: ['dataSource'] },
        { fields: ['barcode'] },
    ],
});

module.exports = Food;
