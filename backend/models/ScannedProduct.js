'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScannedProduct = sequelize.define('ScannedProduct', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    barcode: {
        // Mã vạch EAN-13 chuẩn hóa
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Tên sản phẩm không được để trống.' },
        },
    },

    // Dữ liệu dinh dưỡng per 100g (aggregated từ contributions)
    calories: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    protein: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    carbs: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    fat: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    fiber: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    sugar: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    sodium: {
        // mg per 100g
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '100g', // '100g' hoặc '100ml'
    },
    // Thể tích/khối lượng thực của sản phẩm — từ OpenFoodFacts (vd: "330ml", "500g")
    // null nếu nguồn là community (AI Vision / người dùng tự nhập)
    quantity: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
    },
    // Serving size gốc ghi trên bảng dinh dưỡng (vd: "1 lon 330ml", "30g")
    servingSize: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: null,
    },

    // Metadata
    imageUrl: {
        // Ảnh sản phẩm từ OpenFoodFacts (không phải ảnh chụp của user)
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
    },
    confidenceScore: {
        // 0.0 → 1.0 — mức độ tin cậy của dữ liệu
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
    },
    contributionCount: {
        // Số lượt đóng góp hợp lệ
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM('unverified', 'verified', 'disputed'),
        allowNull: false,
        defaultValue: 'unverified',
    },
    dataSource: {
        type: DataTypes.ENUM('community', 'openfoodfacts'),
        allowNull: false,
        defaultValue: 'community',
    },

    // Liên kết với Food table nếu đã được import vào system food
    foodId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
        references: {
            model: 'foods',
            key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
}, {
    tableName: 'scanned_products',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['barcode'] },
        { fields: ['status'] },
        { fields: ['confidenceScore'] },
        { fields: ['dataSource'] },
    ],
});

module.exports = ScannedProduct;
