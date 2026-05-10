'use strict';

/**
 * fix-fk.js
 * Xử lý lỗi FK constraint fails khi sync DB:
 * 1. Tắt FK checks
 * 2. Drop tất cả FK cũ trên diary_entries
 * 3. Xóa các orphaned rows (foodId không tồn tại trong foods)
 * 4. Sync lại DB để tạo FK đúng
 * Chạy: node scripts/fix-fk.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize } = require('../models');

async function fixFK() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối DB thành công.');

        // 1. Tắt FK checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        console.log('⚠️  Đã tắt FOREIGN_KEY_CHECKS');

        // 2. Lấy danh sách tất cả FK constraints trên bảng diary_entries
        const [constraints] = await sequelize.query(`
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'diary_entries'
              AND REFERENCED_TABLE_NAME IS NOT NULL;
        `);

        console.log(`🔍 Tìm thấy ${constraints.length} FK constraint(s) trên diary_entries:`);
        for (const row of constraints) {
            const name = row.CONSTRAINT_NAME;
            console.log(`   → Drop constraint: ${name}`);
            await sequelize.query(`ALTER TABLE \`diary_entries\` DROP FOREIGN KEY \`${name}\`;`);
        }
        console.log('✅ Đã drop hết FK constraints.');

        // 3. Xóa các orphaned diary_entries (foodId trỏ đến food không còn tồn tại)
        const [orphaned] = await sequelize.query(`
            SELECT COUNT(*) as cnt
            FROM diary_entries de
            WHERE NOT EXISTS (
                SELECT 1 FROM foods f WHERE f.id = de.foodId
            );
        `);
        const orphanCount = orphaned[0].cnt;
        console.log(`🔍 Số lượng orphaned diary_entries: ${orphanCount}`);

        if (orphanCount > 0) {
            await sequelize.query(`
                DELETE de FROM diary_entries de
                WHERE NOT EXISTS (
                    SELECT 1 FROM foods f WHERE f.id = de.foodId
                );
            `);
            console.log(`🗑️  Đã xóa ${orphanCount} orphaned diary_entries.`);
        }

        // 4. Bật lại FK checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        console.log('✅ Đã bật lại FOREIGN_KEY_CHECKS');

        // 5. Sync lại toàn bộ DB (Sequelize tự tạo lại FK đúng)
        console.log('🔄 Đang sync lại database...');
        await sequelize.sync({ alter: true });
        console.log('🎉 Sync thành công! Tất cả FK constraint đã được tạo lại đúng.');

    } catch (err) {
        console.error('❌ Lỗi:', err.message);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('🔒 Đã đóng kết nối.');
    }
}

fixFK();
