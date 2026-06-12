'use strict';
require('dotenv').config();

const { Food } = require('../models');

async function run() {
    try {
        console.log('🔄 Đang tính toán proteinProfile cho tất cả nguyên liệu...');
        
        // Chỉ lấy những món có category là protein (hoặc lấy tất cả có protein > 0)
        const foods = await Food.findAll({
            where: { category: 'protein' }
        });

        let updated = 0;
        for (const f of foods) {
            if (f.protein > 0) {
                const ratio = f.fat / f.protein;
                let profile = null;
                
                if (ratio < 0.3) {
                    profile = 'lean';
                } else if (ratio <= 0.7) {
                    profile = 'moderate';
                } else {
                    profile = 'fatty';
                }

                if (f.proteinProfile !== profile) {
                    f.proteinProfile = profile;
                    await f.save();
                    updated++;
                }
            }
        }
        
        console.log(`✅ Cập nhật thành công ${updated} nguyên liệu.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi:', err);
        process.exit(1);
    }
}

run();
