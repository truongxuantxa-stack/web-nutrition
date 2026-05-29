'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { sequelize, Food } = require('../models');

const imageMapping = {
    'Lòng trắng trứng (Thô)': '/images/foods/long_trang_trung.webp',
    'Dầu Dừa': '/images/foods/dau_dua.webp',
    'Trứng cút (Thô)': '/images/foods/trung_cut.webp',
    'Trứng gà (Thô)': '/images/foods/trung_ga.webp',
    'Thanh Protein (Protein Bar)': '/images/foods/thanh_protein.jfif',
    'Vừng (Mè)': '/images/foods/vung_me.jfif',
    'Sữa Tăng Cơ (Whey Protein)': '/images/foods/sua_tang_co.jfif'
};

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công.');

        for (const [name, imageUrl] of Object.entries(imageMapping)) {
            const [updatedCount] = await Food.update(
                { imageUrl },
                { where: { name } }
            );
            if (updatedCount > 0) {
                console.log(`🎉 Thành công: Cập nhật ảnh cho "${name}" -> ${imageUrl}`);
            } else {
                console.log(`⚠️ Thất bại: Không tìm thấy món "${name}" để cập nhật.`);
            }
        }
    } catch (err) {
        console.error('❌ Lỗi cập nhật:', err.message);
    } finally {
        await sequelize.close();
        console.log('🔒 Đã đóng kết nối database.');
    }
}

run();
