'use strict';

/**
 * Migration script: Thêm cột vitaminA, vitaminC, calcium, iron vào bảng foods
 * và vitaminASnapshot, vitaminCSnapshot, calciumSnapshot, ironSnapshot vào diary_entries.
 *
 * Chạy: node scripts/add-vitamins-minerals.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize } = require('../models');
const { DataTypes } = require('sequelize');

const qi = sequelize.getQueryInterface();

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅  Kết nối database thành công.');

        // ── 1. Thêm cột vào bảng foods ──────────────────────────────────────
        console.log('\n🔄  Đang cập nhật bảng foods...');

        const foodsCols = await qi.describeTable('foods');

        if (!foodsCols.vitaminA) {
            await qi.addColumn('foods', 'vitaminA', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'sodium',
            });
            console.log('   ✔  Thêm cột vitaminA');
        } else {
            console.log('   ⏭  Cột vitaminA đã tồn tại, bỏ qua.');
        }

        if (!foodsCols.vitaminC) {
            await qi.addColumn('foods', 'vitaminC', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'vitaminA',
            });
            console.log('   ✔  Thêm cột vitaminC');
        } else {
            console.log('   ⏭  Cột vitaminC đã tồn tại, bỏ qua.');
        }

        if (!foodsCols.calcium) {
            await qi.addColumn('foods', 'calcium', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'vitaminC',
            });
            console.log('   ✔  Thêm cột calcium');
        } else {
            console.log('   ⏭  Cột calcium đã tồn tại, bỏ qua.');
        }

        if (!foodsCols.iron) {
            await qi.addColumn('foods', 'iron', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'calcium',
            });
            console.log('   ✔  Thêm cột iron');
        } else {
            console.log('   ⏭  Cột iron đã tồn tại, bỏ qua.');
        }

        // ── 2. Thêm cột vào bảng diary_entries ──────────────────────────────
        console.log('\n🔄  Đang cập nhật bảng diary_entries...');

        const diaryCols = await qi.describeTable('diary_entries');

        if (!diaryCols.vitaminASnapshot) {
            await qi.addColumn('diary_entries', 'vitaminASnapshot', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'sodiumSnapshot',
            });
            console.log('   ✔  Thêm cột vitaminASnapshot');
        } else {
            console.log('   ⏭  Cột vitaminASnapshot đã tồn tại, bỏ qua.');
        }

        if (!diaryCols.vitaminCSnapshot) {
            await qi.addColumn('diary_entries', 'vitaminCSnapshot', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'vitaminASnapshot',
            });
            console.log('   ✔  Thêm cột vitaminCSnapshot');
        } else {
            console.log('   ⏭  Cột vitaminCSnapshot đã tồn tại, bỏ qua.');
        }

        if (!diaryCols.calciumSnapshot) {
            await qi.addColumn('diary_entries', 'calciumSnapshot', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'vitaminCSnapshot',
            });
            console.log('   ✔  Thêm cột calciumSnapshot');
        } else {
            console.log('   ⏭  Cột calciumSnapshot đã tồn tại, bỏ qua.');
        }

        if (!diaryCols.ironSnapshot) {
            await qi.addColumn('diary_entries', 'ironSnapshot', {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: null,
                after: 'calciumSnapshot',
            });
            console.log('   ✔  Thêm cột ironSnapshot');
        } else {
            console.log('   ⏭  Cột ironSnapshot đã tồn tại, bỏ qua.');
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
