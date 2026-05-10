'use strict';

/**
 * Migration script: Thêm cột fiber, sugar, sodium vào bảng foods
 * và fiberSnapshot, sugarSnapshot, sodiumSnapshot vào diary_entries.
 *
 * Chạy: node scripts/add-micronutrients.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize } = require('../models');
const { QueryInterface, DataTypes } = require('sequelize');

const qi = sequelize.getQueryInterface();

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅  Kết nối database thành công.');

        // ── 1. Thêm cột vào bảng foods ──────────────────────────────────────
        console.log('\n🔄  Đang cập nhật bảng foods...');

        const foodsCols = await qi.describeTable('foods');

        if (!foodsCols.fiber) {
            await qi.addColumn('foods', 'fiber', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'fat',
            });
            console.log('   ✔  Thêm cột fiber');
        } else {
            console.log('   ⏭  Cột fiber đã tồn tại, bỏ qua.');
        }

        if (!foodsCols.sugar) {
            await qi.addColumn('foods', 'sugar', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'fiber',
            });
            console.log('   ✔  Thêm cột sugar');
        } else {
            console.log('   ⏭  Cột sugar đã tồn tại, bỏ qua.');
        }

        if (!foodsCols.sodium) {
            await qi.addColumn('foods', 'sodium', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'sugar',
            });
            console.log('   ✔  Thêm cột sodium');
        } else {
            console.log('   ⏭  Cột sodium đã tồn tại, bỏ qua.');
        }

        // ── 2. Thêm cột vào bảng diary_entries ──────────────────────────────
        console.log('\n🔄  Đang cập nhật bảng diary_entries...');

        const diaryCols = await qi.describeTable('diary_entries');

        if (!diaryCols.fiberSnapshot) {
            await qi.addColumn('diary_entries', 'fiberSnapshot', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'fatSnapshot',
            });
            console.log('   ✔  Thêm cột fiberSnapshot');
        } else {
            console.log('   ⏭  Cột fiberSnapshot đã tồn tại, bỏ qua.');
        }

        if (!diaryCols.sugarSnapshot) {
            await qi.addColumn('diary_entries', 'sugarSnapshot', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'fiberSnapshot',
            });
            console.log('   ✔  Thêm cột sugarSnapshot');
        } else {
            console.log('   ⏭  Cột sugarSnapshot đã tồn tại, bỏ qua.');
        }

        if (!diaryCols.sodiumSnapshot) {
            await qi.addColumn('diary_entries', 'sodiumSnapshot', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'sugarSnapshot',
            });
            console.log('   ✔  Thêm cột sodiumSnapshot');
        } else {
            console.log('   ⏭  Cột sodiumSnapshot đã tồn tại, bỏ qua.');
        }

        console.log('\n🎉  Migration hoàn tất! Tất cả các cột mới đã được thêm vào.');
        console.log('ℹ️   Giá trị mặc định là NULL — sẽ được cập nhật khi chạy seeder.');

    } catch (err) {
        console.error('❌  Migration thất bại:', err.message);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('🔒  Đã đóng kết nối database.');
    }
}

run();
