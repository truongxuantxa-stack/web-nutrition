'use strict';
/**
 * seed-fruit-servings.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bổ sung bản ghi thực phẩm cho nhóm Hoa Quả với đơn vị thực tế (quả, miếng, lát, múi).
 * Lấy dữ liệu từ bản ghi 'raw' gốc và nhân với hệ số khối lượng tương ứng.
 *
 * Chạy: node backend/scripts/seed-fruit-servings.js
 */

require('dotenv').config();
const { Food, sequelize } = require('../models');

const fruitsConfig = [
    { targetName: 'Chuối (1 quả)', sourceName: 'Chuối (Thô)', ratio: 1.18, unit: 'quả' },
    { targetName: 'Táo đỏ (1 quả)', sourceName: 'Táo đỏ', ratio: 1.80, unit: 'quả' },
    { targetName: 'Đu đủ (1 miếng)', sourceName: 'Đu đủ (Chín)', ratio: 1.50, unit: 'miếng' },
    { targetName: 'Xoài (1 quả)', sourceName: 'Xoài (Chín)', ratio: 2.00, unit: 'quả' },
    { targetName: 'Dưa hấu (1 miếng)', sourceName: 'Dưa hấu', ratio: 2.00, unit: 'miếng' },
    { targetName: 'Thanh long (1 quả)', sourceName: 'Thanh long', ratio: 2.50, unit: 'quả' },
    { targetName: 'Bưởi (1 múi)', sourceName: 'Bưởi', ratio: 0.50, unit: 'múi' },
    { targetName: 'Ổi (1 quả)', sourceName: 'Ổi', ratio: 1.50, unit: 'quả' },
    { targetName: 'Cam (1 quả)', sourceName: 'Cam (Thô)', ratio: 1.30, unit: 'quả' },
    { targetName: 'Quýt (1 quả)', sourceName: 'Quýt (Thô)', ratio: 0.90, unit: 'quả' },
    { targetName: 'Kiwi (1 quả)', sourceName: 'Kiwi', ratio: 0.75, unit: 'quả' },
    { targetName: 'Lê (1 quả)', sourceName: 'Lê', ratio: 1.80, unit: 'quả' },
    { targetName: 'Mận (1 quả)', sourceName: 'Mận (Thô)', ratio: 0.65, unit: 'quả' },
    { targetName: 'Dứa (1 lát)', sourceName: 'Dứa (Thơm)', ratio: 1.50, unit: 'lát' },
    { targetName: 'Măng cụt (1 quả)', sourceName: 'Măng cụt', ratio: 0.80, unit: 'quả' },
    { targetName: 'Chôm chôm (1 quả)', sourceName: 'Chôm chôm', ratio: 0.20, unit: 'quả' },
];

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công.');

        for (const config of fruitsConfig) {
            const sourceFood = await Food.findOne({ where: { name: config.sourceName, foodType: 'raw' } });
            
            if (!sourceFood) {
                console.log(`⚠️ Không tìm thấy nguồn: ${config.sourceName}. Bỏ qua ${config.targetName}.`);
                continue;
            }

            const multiplier = config.ratio;
            const targetData = {
                name: config.targetName,
                calories: Math.round(sourceFood.calories * multiplier),
                protein: Number((sourceFood.protein * multiplier).toFixed(1)),
                carbs: Number((sourceFood.carbs * multiplier).toFixed(1)),
                fat: Number((sourceFood.fat * multiplier).toFixed(1)),
                fiber: sourceFood.fiber != null ? Number((sourceFood.fiber * multiplier).toFixed(1)) : null,
                sugar: sourceFood.sugar != null ? Number((sourceFood.sugar * multiplier).toFixed(1)) : null,
                sodium: sourceFood.sodium != null ? Math.round(sourceFood.sodium * multiplier) : null,
                vitaminA: sourceFood.vitaminA != null ? Math.round(sourceFood.vitaminA * multiplier) : null,
                vitaminC: sourceFood.vitaminC != null ? Number((sourceFood.vitaminC * multiplier).toFixed(1)) : null,
                calcium: sourceFood.calcium != null ? Math.round(sourceFood.calcium * multiplier) : null,
                iron: sourceFood.iron != null ? Number((sourceFood.iron * multiplier).toFixed(1)) : null,
                unit: config.unit,
                category: sourceFood.category,
                foodType: 'dish',
                isSuggestable: false,
                isCustom: false,
                imageUrl: sourceFood.imageUrl || null
            };

            const [food, created] = await Food.findOrCreate({
                where: { name: config.targetName },
                defaults: targetData
            });

            if (!created) {
                // update
                await food.update(targetData);
                console.log(`🔄 Đã cập nhật: ${config.targetName}`);
            } else {
                console.log(`✅ Đã tạo mới: ${config.targetName}`);
            }
        }

        console.log('\n✨ Chạy thành công seed-fruit-servings!');
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('🔒 Đã đóng kết nối database.');
        process.exit(0);
    }
}

run();
