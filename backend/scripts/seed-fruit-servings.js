'use strict';
require('dotenv').config();
const { Food, sequelize } = require('../models');

const fruitMappings = [
  { newName: 'Chuối (1 quả)', baseName: 'Chuối (Thô)', coeff: 1.18, unit: 'quả' },
  { newName: 'Táo đỏ (1 quả)', baseName: 'Táo đỏ (Thô)', coeff: 1.80, unit: 'quả' },
  { newName: 'Đu đủ (1 miếng)', baseName: 'Đu đủ (Chín)', coeff: 1.50, unit: 'miếng' },
  { newName: 'Xoài (1 quả)', baseName: 'Xoài (Chín)', coeff: 2.00, unit: 'quả' },
  { newName: 'Dưa hấu (1 miếng)', baseName: 'Dưa hấu (Thô)', coeff: 2.00, unit: 'miếng' },
  { newName: 'Thanh long (1 quả)', baseName: 'Thanh long (Thô)', coeff: 2.50, unit: 'quả' },
  { newName: 'Bưởi (1 múi)', baseName: 'Bưởi (Thô)', coeff: 0.50, unit: 'múi' },
  { newName: 'Ổi (1 quả)', baseName: 'Ổi (Thô)', coeff: 1.50, unit: 'quả' },
  { newName: 'Cam (1 quả)', baseName: 'Cam (Thô)', coeff: 1.30, unit: 'quả' },
  { newName: 'Quýt (1 quả)', baseName: 'Quýt (Thô)', coeff: 0.90, unit: 'quả' },
  { newName: 'Kiwi (1 quả)', baseName: 'Kiwi (Thô)', coeff: 0.75, unit: 'quả' },
  { newName: 'Lê (1 quả)', baseName: 'Lê (Thô)', coeff: 1.80, unit: 'quả' },
  { newName: 'Mận (1 quả)', baseName: 'Mận (Thô)', coeff: 0.65, unit: 'quả' },
  { newName: 'Dứa (1 lát)', baseName: 'Dứa (Thơm)', coeff: 1.50, unit: 'lát' },
  { newName: 'Măng cụt (1 quả)', baseName: 'Măng cụt (Thô)', coeff: 0.80, unit: 'quả' },
  { newName: 'Chôm chôm (1 quả)', baseName: 'Chôm chôm (Thô)', coeff: 0.20, unit: 'quả' }
];

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Đã kết nối database.');

    let count = 0;
    for (const mapping of fruitMappings) {
      const baseFood = await Food.findOne({ where: { name: mapping.baseName, foodType: 'raw' } });
      if (!baseFood) {
        console.log(`⚠️ Không tìm thấy bản gốc: ${mapping.baseName}. Bỏ qua ${mapping.newName}`);
        continue;
      }

      const { coeff } = mapping;
      const round1 = (val) => val != null ? Math.round(val * coeff * 10) / 10 : 0;
      const round0 = (val) => val != null ? Math.round(val * coeff) : 0;

      const newFoodData = {
        name: mapping.newName,
        calories: round0(baseFood.calories),
        protein: round1(baseFood.protein),
        carbs: round1(baseFood.carbs),
        fat: round1(baseFood.fat),
        fiber: round1(baseFood.fiber),
        sugar: round1(baseFood.sugar),
        sodium: round0(baseFood.sodium),
        vitaminA: round0(baseFood.vitaminA),
        vitaminC: round1(baseFood.vitaminC),
        calcium: round0(baseFood.calcium),
        iron: round1(baseFood.iron),
        unit: mapping.unit,
        category: baseFood.category,
        foodType: 'dish',
        isSuggestable: false,
        isCustom: false
      };

      const [food, created] = await Food.findOrCreate({
        where: { name: mapping.newName },
        defaults: newFoodData
      });

      if (!created) {
        // Cập nhật lại nếu file đã tồn tại nhưng data cũ
        await food.update(newFoodData);
      }
      count++;
    }

    console.log(`🎉 Đã xử lý xong ${count} bản ghi trái cây.`);
  } catch (error) {
    console.error('❌ Có lỗi xảy ra:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

run();
