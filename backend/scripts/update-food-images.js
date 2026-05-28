'use strict';
/**
 * Cập nhật imageUrl cho thực phẩm thô.
 * Chạy: node scripts/update-food-images.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Food } = require('../models');

// [tên, imageUrl]
const updates = [
    // ── PROTEIN ─────────────────────────────────────
    ['Ức gà (Thô)', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop'],
    ['Cá hồi tươi (Thô)', 'https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=400&h=300&fit=crop'],
    ['Thịt bò thăn (Thô)', 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=400&h=300&fit=crop'],
    ['Đậu phụ (Thô)', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'],
    ['Trứng gà (Thô)', 'https://images.unsplash.com/photo-1587486913049-53fc88980cb5?w=400&h=300&fit=crop'],
    ['Sữa chua Hy Lạp (Thô)', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop'],
    
    // ── CARB ────────────────────────────────────────
    ['Cơm trắng (Thô/Chín)', 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&h=300&fit=crop'],
    ['Yến mạch khô (Thô)', 'https://images.unsplash.com/photo-1517673132405-a56a6eb01fc3?w=400&h=300&fit=crop'],
    ['Khoai lang (Thô)', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=300&fit=crop'],
    ['Gạo lứt (Thô)', 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=400&h=300&fit=crop'],

    // ── FIBER ───────────────────────────────────────
    ['Bông cải xanh (Thô)', 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&h=300&fit=crop'],
    ['Rau xà lách', 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400&h=300&fit=crop'],
    ['Cà chua', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop'],
    ['Cà rốt', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=300&fit=crop'],
    ['Dưa chuột', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop'],

    // ── VITAMIN ─────────────────────────────────────
    ['Chuối (Thô)', 'https://images.unsplash.com/photo-1571501679680-bd5a119f1a2b?w=400&h=300&fit=crop'],
    ['Cam (Thô)', 'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&h=300&fit=crop'],
    ['Quả Dâu tây', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=300&fit=crop'],
    ['Táo đỏ', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?w=400&h=300&fit=crop'],

    // ── FAT ─────────────────────────────────────────
    ['Quả Bơ (Thô)', 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=300&fit=crop'],
    ['Hạt Hạnh nhân (Thô)', 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&h=300&fit=crop'],
    ['Hạt Chia (Thô)', 'https://images.unsplash.com/photo-1590483849557-04870f44383c?w=400&h=300&fit=crop'],
];

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅  Kết nối database thành công.');

        let updated = 0;
        let notFound = 0;

        for (const [name, imageUrl] of updates) {
            const food = await Food.findOne({ where: { name } });
            if (!food) {
                console.log(`   ⚠️  Không tìm thấy: "${name}"`);
                notFound++;
                continue;
            }
            await food.update({ imageUrl });
            updated++;
        }

        // Cập nhật các món nguyên liệu thô còn lại (dùng ảnh generic theo category)
        const genericImages = {
            'protein': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
            'thit_ca': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
            'carb': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=300&fit=crop',
            'com': 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&h=300&fit=crop',
            'pho_bun': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cb438?w=400&h=300&fit=crop',
            'banh': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
            'fiber': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
            'rau_cu': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
            'vitamin': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop',
            'trai_cay': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&h=300&fit=crop',
            'fat': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=300&fit=crop',
            'do_uong': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
            'khac': 'https://images.unsplash.com/photo-1490818387583-1b5f2621124c?w=400&h=300&fit=crop'
        };

        const rawFoodsWithoutImage = await Food.findAll({
            where: { foodType: 'raw', imageUrl: null, isCustom: false }
        });

        let genericUpdated = 0;
        for (const food of rawFoodsWithoutImage) {
            const genericImg = genericImages[food.category] || genericImages['khac'];
            await food.update({ imageUrl: genericImg });
            genericUpdated++;
        }

        console.log(`\n🎉  Hoàn tất! Đã cập nhật ${updated} món cụ thể, không tìm thấy ${notFound} món.`);
        console.log(`🎉  Đã cập nhật thêm ${genericUpdated} món bằng ảnh mặc định theo danh mục.`);
    } catch (err) {
        console.error('❌  Lỗi:', err.message);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('🔒  Đã đóng kết nối.');
    }
}

run();
