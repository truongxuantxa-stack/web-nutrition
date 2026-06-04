'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { sequelize, Food } = require('../models');

const newFoods = [
    { name: 'Cá Viên Chiên', calories: 290, protein: 12, carbs: 22, fat: 18, fiber: 0.5, sugar: 2, sodium: 680, vitaminA: 5, vitaminC: 0, calcium: 30, iron: 1.2, unit: 'suất 200g', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Gà Rán (KFC-style)', calories: 320, protein: 18, carbs: 16, fat: 22, fiber: 0.5, sugar: 0.5, sodium: 780, vitaminA: 5, vitaminC: 0, calcium: 20, iron: 1.0, unit: 'miếng 150g', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Pizza Phô Mai', calories: 540, protein: 22, carbs: 58, fat: 24, fiber: 2.5, sugar: 6, sodium: 1200, vitaminA: 80, vitaminC: 3, calcium: 220, iron: 2.8, unit: '2 miếng', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Hamburger Bò Phô Mai', calories: 550, protein: 28, carbs: 40, fat: 30, fiber: 2, sugar: 8, sodium: 950, vitaminA: 30, vitaminC: 2, calcium: 180, iron: 3.5, unit: 'cái', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Trà Đá', calories: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0, sugar: 0, sodium: 1, vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true }
];

const updateFoods = [
    { name: 'Bánh Mì Pate Xá Xíu', fiber: 1.5, sugar: 4, sodium: 850, vitaminA: 80, vitaminC: 2, calcium: 40, iron: 2.5 },
    { name: 'Bánh Tráng Trộn', fiber: 1.5, sugar: 3, sodium: 520, vitaminA: 10, vitaminC: 5, calcium: 25, iron: 0.8 },
    { name: 'Nước Mía', fiber: 0, sugar: 18, sodium: 5, vitaminA: 0, vitaminC: 0.5, calcium: 12, iron: 0.4 },
    { name: 'Trà Sữa Trân Châu', fiber: 0, sugar: 50, sodium: 80, vitaminA: 0, vitaminC: 0, calcium: 60, iron: 0.3 },
    { name: 'Cà Phê Đen Không Đường', fiber: 0, sugar: 0, sodium: 5, vitaminA: 0, vitaminC: 0, calcium: 2, iron: 0 },
    { name: 'Cà Phê Sữa Đá', fiber: 0, sugar: 16, sodium: 30, vitaminA: 5, vitaminC: 0, calcium: 40, iron: 0.1 }
];

async function seedStreetFoods() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công.');

        let insertedCount = 0;
        let updatedCount = 0;

        // 1. Insert new foods
        for (const f of newFoods) {
            const [food, created] = await Food.findOrCreate({
                where: { name: f.name },
                defaults: f
            });
            if (created) {
                insertedCount++;
            } else {
                // If it exists, update it just in case
                await food.update(f);
                updatedCount++;
            }
        }

        // 2. Update existing foods
        for (const u of updateFoods) {
            const food = await Food.findOne({ where: { name: u.name } });
            if (food) {
                await food.update(u);
                updatedCount++;
            } else {
                console.warn(`⚠️ Cảnh báo: Không tìm thấy món "${u.name}" trong database để update.`);
            }
        }

        console.log(`🎉 Thành công: Thêm mới ${insertedCount} món, Cập nhật ${updatedCount} món.`);
        
    } catch (err) {
        console.error('❌ Lỗi:', err);
    } finally {
        await sequelize.close();
        console.log('🔒 Đã đóng kết nối database.');
    }
}

seedStreetFoods();
