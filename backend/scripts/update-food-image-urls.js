require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const { Food } = require('../models');
const sequelize = require('../config/database');

async function main() {
    try {
        console.log('--- Step 5: Update Database Image URLs ---');
        await sequelize.authenticate();
        
        const isDryRun = process.argv.includes('--dry-run');
        if (isDryRun) console.log('>>> DRY RUN MODE - No DB changes will be made <<<\n');

        const mappingPath = path.join(__dirname, '../scratch/food_name_mapping.json');
        const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
        
        const publicDir = path.join(__dirname, '../public');

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const item of mapping) {
            const localPath = `/images/foods/${item.filename}`;
            const fullPath = path.join(publicDir, localPath);

            // Chuẩn hóa tên để đối chiếu (bỏ các hậu tố như "(Thô)", "(Khô)")
            let cleanName = item.vietnamese.replace(' (Thô)', '').replace(' (Nấm mèo khô)', '').replace(' (Khô)', '');
            if (cleanName === 'Bánh phở tươi') cleanName = 'Bánh phở';

            // Kiểm tra file tồn tại trước khi update
            if (fs.existsSync(fullPath)) {
                if (!isDryRun) {
                    // Cập nhật dựa trên Tên (để tránh lỗi khi Database ID bị thay đổi do reset/seed)
                    const [count] = await Food.update({ imageUrl: localPath }, { where: { name: cleanName } });
                    if (count > 0) updatedCount++;
                    
                    // Fallback cho các món dùng chung ảnh (nếu ID không bị thay đổi)
                    if (item.shared_with_ids && item.shared_with_ids.length > 0) {
                        await Food.update({ imageUrl: localPath }, { where: { id: item.shared_with_ids } });
                    }
                } else {
                    updatedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        console.log(`\nUpdate DB Complete!`);
        console.log(`- Updated: ${updatedCount}`);
        console.log(`- Skipped (file not found): ${skippedCount}`);
        console.log(`- Error: ${errorCount}`);

        process.exit(0);
    } catch (e) {
        console.error('Error updating DB:', e);
        process.exit(1);
    }
}

main();
