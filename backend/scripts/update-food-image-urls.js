'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Food } = require('../models');
const fs = require('fs');
const path = require('path');

const mappingFile = path.resolve(__dirname, '../scratch/food_name_mapping.json');
const publicFoodsDir = path.resolve(__dirname, '../public/images/foods');

const isDryRun = process.argv.includes('--dry-run');

async function main() {
    try {
        const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
        
        let updatedCount = 0;
        let skippedCount = 0;

        for (const item of mapping) {
            const destPath = path.join(publicFoodsDir, item.filename);
            const relativeUrl = `/images/foods/${item.filename}`;
            
            if (fs.existsSync(destPath)) {
                if (!isDryRun) {
                    await Food.update(
                        { imageUrl: relativeUrl },
                        { where: { id: item.id } }
                    );
                }
                updatedCount++;
                console.log(`✅ Cập nhật ID ${item.id}: ${relativeUrl}`);
                
                // Xử lý shared_with_ids (dedup)
                if (item.shared_with_ids && item.shared_with_ids.length > 0) {
                     for (const sharedId of item.shared_with_ids) {
                         if (!isDryRun) {
                            await Food.update(
                                { imageUrl: relativeUrl },
                                { where: { id: sharedId } }
                            );
                         }
                         updatedCount++;
                         console.log(`✅ Cập nhật ID ${sharedId} (dùng chung với ${item.id}): ${relativeUrl}`);
                     }
                }
            } else {
                // If it doesn't exist, we just skip it. It might be a shared one that was updated by its parent
                skippedCount++;
            }
        }

        console.log('\n--- KẾT QUẢ UPDATE ---');
        console.log(`Trạng thái Dry Run: ${isDryRun ? 'BẬT (không lưu vào DB)' : 'TẮT (đã lưu vào DB)'}`);
        console.log(`Đã cập nhật: ${updatedCount} records`);
        console.log(`Bỏ qua (chưa có ảnh local): ${skippedCount} records`);

    } catch (error) {
        console.error('Lỗi khi cập nhật:', error);
    } finally {
        await sequelize.close();
        console.log('Đã đóng kết nối Database.');
    }
}

main();
