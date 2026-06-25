'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { sequelize, Food } = require('../models');

async function createBackup() {
    console.log('📦 Đang tạo bản backup trước khi xóa...');
    const backupsDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Chỉ backup dữ liệu hệ thống (isCustom: false, userId: null) —
    // nhất quán với bulkDelete bên dưới, không đụng đến dữ liệu custom của user
    const currentFoods = await Food.findAll({
        where: {
            isCustom: false,
            userId: null
        },
        raw: true
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupsDir, `foods_backup_${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(currentFoods, null, 2), 'utf-8');
    console.log(`✅ Đã sao lưu ${currentFoods.length} món ăn ra file: ${backupPath}`);

    // Giới hạn 5 file backup
    const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('foods_backup_') && f.endsWith('.json'))
        .map(f => ({ name: f, time: fs.statSync(path.join(backupsDir, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time); // Mới nhất lên đầu

    if (files.length > 5) {
        const filesToDelete = files.slice(5);
        filesToDelete.forEach(file => {
            const filePath = path.join(backupsDir, file.name);
            fs.unlinkSync(filePath);
            console.log(`🗑️  Đã xóa file backup cũ: ${file.name}`);
        });
    }
}

async function seedFoods() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(r => rl.question('⚠️  SẼ XÓA TOÀN BỘ BẢNG FOODS (dữ liệu hệ thống). Gõ "YES" để xác nhận: ', r));
    rl.close();

    if (answer.trim() !== 'YES') {
        console.log('❌ Đã hủy.');
        process.exit(0);
    }

    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công.');

        // Backup
        await createBackup();

        // Đọc dữ liệu từ file JSON (dùng fs để tránh bị cache bởi Node module system)
        const allFoods = JSON.parse(fs.readFileSync(path.join(__dirname, './data/foods_dump.json'), 'utf-8'));
        
        console.log('🔄 Đang đồng bộ cấu trúc bảng foods...');
        await Food.sync({ alter: true });
        console.log('✅ Đồng bộ xong.');

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        try {
            console.log('⚠️  Tiến hành xóa dữ liệu hệ thống trong bảng foods...');
            // Chỉ xóa dữ liệu hệ thống, giữ nguyên món ăn custom của user
            await sequelize.queryInterface.bulkDelete('foods', { isCustom: false }, {});
        } finally {
            // Luôn bật lại FK checks dù có lỗi hay không
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
        }

        const now = new Date();
        const foodsToInsert = allFoods.map(f => ({
            ...f,
            createdAt: now,
            updatedAt: now
        }));

        console.log(`⏳ Đang insert ${foodsToInsert.length} món ăn...`);
        const inserted = await Food.bulkCreate(foodsToInsert, { validate: true });
        console.log(`🎉 Seed thành công: ${inserted.length} món ăn đã được thêm vào bảng foods.`);

    } catch (error) {
        console.error('❌ Seed thất bại:', error.message);
        if (error.errors) {
            error.errors.forEach((e) => console.error('   -', e.message));
        }
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('\n🔒 Đã đóng kết nối database.');
    }
}

// Chỉ chạy khi file được gọi TRỰC TIẾP (node seeders/foods.js)
// Tránh tự động thực thi khi bị require() bởi file khác → Ngăn xóa DB nhầm!
if (require.main === module) {
    seedFoods();
}
