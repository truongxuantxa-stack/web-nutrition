'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Xóa dữ liệu cũ để tránh trùng lặp
    await queryInterface.bulkDelete('foods', null, {});

    const now = new Date();

    const rawFoods = [
      // 1. Nhóm Protein (Chất đạm sạch)
      { name: 'Ức gà (Thô)', calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: 'g', category: 'thit_ca', foodType: 'raw', isSuggestable: false },
      { name: 'Thịt bò thăn (Thô)', calories: 250, protein: 26, carbs: 0, fat: 15, unit: 'g', category: 'thit_ca', foodType: 'raw', isSuggestable: false },
      { name: 'Cá hồi tươi (Thô)', calories: 208, protein: 20, carbs: 0, fat: 13, unit: 'g', category: 'thit_ca', foodType: 'raw', isSuggestable: false },
      { name: 'Cá rô phi (Thô)', calories: 128, protein: 26, carbs: 0, fat: 2.7, unit: 'g', category: 'thit_ca', foodType: 'raw', isSuggestable: false },
      { name: 'Tôm tươi (Thô)', calories: 99, protein: 24, carbs: 0, fat: 0.3, unit: 'g', category: 'thit_ca', foodType: 'raw', isSuggestable: false },
      { name: 'Lòng trắng trứng (Thô)', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, unit: 'g', category: 'thit_ca', foodType: 'raw', isSuggestable: false },
      { name: 'Đậu phụ (Thô)', calories: 76, protein: 8, carbs: 2, fat: 4.8, unit: 'g', category: 'khac', foodType: 'raw', isSuggestable: false },
      { name: 'Sữa chua Hy Lạp (Thô)', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, unit: 'g', category: 'khac', foodType: 'raw', isSuggestable: false },

      // 2. Nhóm Carb (Tinh bột chậm & Chất xơ)
      { name: 'Yến mạch khô (Thô)', calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, unit: 'g', category: 'khac', foodType: 'raw', isSuggestable: false },
      { name: 'Gạo lứt (Thô)', calories: 350, protein: 7.5, carbs: 73, fat: 2.7, unit: 'g', category: 'com', foodType: 'raw', isSuggestable: false },
      { name: 'Khoai lang (Thô)', calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, unit: 'g', category: 'rau_cu', foodType: 'raw', isSuggestable: false },
      { name: 'Hạt Quinoa (Thô)', calories: 368, protein: 14.1, carbs: 64.2, fat: 6.1, unit: 'g', category: 'khac', foodType: 'raw', isSuggestable: false },
      { name: 'Bông cải xanh (Thô)', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, unit: 'g', category: 'rau_cu', foodType: 'raw', isSuggestable: false },
      { name: 'Chuối (Thô)', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, unit: 'g', category: 'trai_cay', foodType: 'raw', isSuggestable: false },

      // 3. Nhóm Fat (Chất béo tốt)
      { name: 'Quả Bơ (Thô)', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, unit: 'g', category: 'trai_cay', foodType: 'raw', isSuggestable: false },
      { name: 'Hạt Hạnh nhân (Thô)', calories: 579, protein: 21.2, carbs: 21.7, fat: 49.9, unit: 'g', category: 'khac', foodType: 'raw', isSuggestable: false },
      { name: 'Hạt Chia (Thô)', calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7, unit: 'g', category: 'khac', foodType: 'raw', isSuggestable: false },
      { name: 'Dầu Olive (Thô)', calories: 884, protein: 0, carbs: 0, fat: 100, unit: 'g', category: 'khac', foodType: 'raw', isSuggestable: false },
    ];

    const dishes = [
      // 4. Nhóm Món ăn chế biến (Dùng để gợi ý)
      { name: 'Salad Ức gà áp chảo', calories: 320, protein: 35, carbs: 12, fat: 14, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
      { name: 'Cơm gạo lứt thịt bò', calories: 450, protein: 28, carbs: 55, fat: 12, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
      { name: 'Bánh mì ngũ cốc trứng', calories: 310, protein: 14, carbs: 35, fat: 12, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true }
    ];

    const allFoods = [...rawFoods, ...dishes].map(food => ({
      ...food,
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('foods', allFoods, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('foods', null, {});
  }
};
