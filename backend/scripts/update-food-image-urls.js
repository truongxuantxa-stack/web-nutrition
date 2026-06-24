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

            // Kiểm tra file tồn tại trước khi update
            if (fs.existsSync(fullPath)) {
                if (!isDryRun) {
                    await Food.update({ imageUrl: localPath }, { where: { id: item.id } });
                }
                updatedCount++;
            } else {
                skippedCount++;
            }
            
            // Cập nhật luôn cho các món dedup dùng chung ảnh
            if (item.shared_with_ids && item.shared_with_ids.length > 0) {
                if (fs.existsSync(fullPath)) {
                    if (!isDryRun) {
                        await Food.update({ imageUrl: localPath }, { where: { id: item.shared_with_ids } });
                    }
                    updatedCount += item.shared_with_ids.length;
                } else {
                    skippedCount += item.shared_with_ids.length;
                }
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
