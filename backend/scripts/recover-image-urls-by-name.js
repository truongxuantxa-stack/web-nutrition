require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Food } = require('../models');
const sequelize = require('../config/database');

async function main() {
    try {
        console.log('--- Khôi phục toàn bộ Image URLs dựa trên Tên món ăn ---');
        await sequelize.authenticate();
        
        const scanPath = path.join(__dirname, '../scratch/food_image_scan_result.json');
        const mappingPath = path.join(__dirname, '../scratch/food_name_mapping.json');
        const publicDir = path.join(__dirname, '../public');

        const scanResults = fs.existsSync(scanPath) ? JSON.parse(fs.readFileSync(scanPath, 'utf-8')) : [];
        const mapping = fs.existsSync(mappingPath) ? JSON.parse(fs.readFileSync(mappingPath, 'utf-8')) : [];

        // Tạo dictionary cho tất cả ảnh cũ (cả KEEP và REPLACE)
        const oldImageMap = new Map();
        for (const item of scanResults) {
            if (item.currentImageUrl) {
                oldImageMap.set(item.name.toLowerCase().trim(), item.currentImageUrl);
            }
        }

        // Tạo dictionary cho ảnh AI mới
        const newImageMap = new Map();
        for (const item of mapping) {
            const localPath = `/images/foods/${item.filename}`;
            if (fs.existsSync(path.join(publicDir, localPath))) {
                newImageMap.set(item.vietnamese.toLowerCase().trim(), localPath);
            }
        }

        // Lấy toàn bộ foods từ DB
        const foods = await Food.findAll();
        let restoredOldCount = 0;
        let restoredNewCount = 0;
        let missingCount = 0;

        for (const food of foods) {
            const nameKey = food.name.toLowerCase().trim();
            
            if (newImageMap.has(nameKey)) {
                await food.update({ imageUrl: newImageMap.get(nameKey) });
                restoredNewCount++;
            } else if (oldImageMap.has(nameKey)) {
                await food.update({ imageUrl: oldImageMap.get(nameKey) });
                restoredOldCount++;
            } else {
                missingCount++;
            }
        }

        console.log(`\nKhôi phục hoàn tất!`);
        console.log(`- Đã cập nhật ảnh AI mới (Local): ${restoredNewCount}`);
        console.log(`- Đã khôi phục ảnh cũ (Unsplash/Bing): ${restoredOldCount}`);
        console.log(`- Vẫn không có ảnh (Null/Rỗng): ${missingCount}`);

        process.exit(0);
    } catch (e) {
        console.error('Error recovering URLs:', e);
        process.exit(1);
    }
}

main();
