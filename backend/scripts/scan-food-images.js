'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Food } = require('../models');
const fs = require('fs');
const path = require('path');

const SCRATCH_DIR = path.resolve(__dirname, '../scratch');
if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
}

async function main() {
    try {
        console.log('Đang kết nối Database và lấy dữ liệu thức ăn hệ thống (isCustom: false)...');
        const foods = await Food.findAll({
            where: { isCustom: false },
            attributes: ['id', 'name', 'foodType', 'category', 'imageUrl'],
            raw: true
        });

        console.log(`Đã lấy ${foods.length} món ăn.`);

        let countKeep = 0;
        let countReplace = 0;
        let countMissing = 0;

        const scanResult = [];
        const backupResult = [];

        for (const food of foods) {
            let status = '';
            const img = food.imageUrl;
            
            // Lọc ra backup
            backupResult.push({ id: food.id, imageUrl: img });

            if (!img || img.trim() === '') {
                status = 'MISSING';
                countMissing++;
            } else if (img.includes('wikimedia') || img.startsWith('/images/foods/')) {
                status = 'KEEP';
                countKeep++;
            } else {
                status = 'REPLACE';
                countReplace++;
            }

            scanResult.push({
                id: food.id,
                name: food.name,
                foodType: food.foodType,
                category: food.category,
                currentImageUrl: img,
                status: status
            });
        }

        const scanResultPath = path.join(SCRATCH_DIR, 'food_image_scan_result.json');
        const backupPath = path.join(SCRATCH_DIR, 'backup_image_urls.json');

        fs.writeFileSync(scanResultPath, JSON.stringify(scanResult, null, 2), 'utf-8');
        fs.writeFileSync(backupPath, JSON.stringify(backupResult, null, 2), 'utf-8');

        console.log('\n--- KẾT QUẢ QUÉT ẢNH ---');
        console.log(`✅ KEEP    : ${countKeep} ảnh (Đã chuẩn: wikimedia hoặc local)`);
        console.log(`🔄 REPLACE : ${countReplace} ảnh (Cần thay thế: Bing, Unsplash, external...)`);
        console.log(`❌ MISSING : ${countMissing} ảnh (Không có ảnh)`);
        console.log('------------------------');
        console.log(`Đã lưu kết quả phân loại tại : ${scanResultPath}`);
        console.log(`Đã lưu backup url hiện tại tại: ${backupPath}`);

    } catch (error) {
        console.error('Lỗi khi quét:', error);
    } finally {
        await sequelize.close();
        console.log('Đã đóng kết nối Database.');
    }
}

main();
