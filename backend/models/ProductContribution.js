'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductContribution = sequelize.define('ProductContribution', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    scannedProductId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: 'scanned_products',
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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

    // Dữ liệu raw mà user/AI trích xuất
    rawCalories: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    rawProtein: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    rawCarbs: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    rawFat: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    rawFiber: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    rawSugar: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    rawSodium: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
    },
    rawUnit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '100g', // '100g' hoặc '100ml'
    },

    source: {
        type: DataTypes.ENUM('ai_vision', 'manual', 'openfoodfacts'),
        allowNull: false,
    },
    isRejected: {
        // true nếu bị Physics Validation reject
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    rejectReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: 'product_contributions',
    timestamps: true,
    indexes: [
        { fields: ['scannedProductId', 'userId'] },
        { fields: ['userId'] },
        { fields: ['scannedProductId'] },
    ],
});

module.exports = ProductContribution;
