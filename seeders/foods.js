'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Food } = require('../models');

const rawFoods = [
    // 1. Nhóm Protein (Chất đạm sạch) -> category: 'protein'
    { name: 'Ức gà (Thô)', calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Thịt bò thăn (Thô)', calories: 250, protein: 26, carbs: 0, fat: 15, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá hồi tươi (Thô)', calories: 208, protein: 20, carbs: 0, fat: 13, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá rô phi (Thô)', calories: 128, protein: 26, carbs: 0, fat: 2.7, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Tôm tươi (Thô)', calories: 99, protein: 24, carbs: 0, fat: 0.3, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Lòng trắng trứng (Thô)', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Đậu phụ (Thô)', calories: 76, protein: 8, carbs: 2, fat: 4.8, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Sữa chua Hy Lạp (Thô)', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Thịt đùi gà (Bỏ da)', calories: 120, protein: 20, carbs: 0, fat: 4, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Thịt lợn thăn (Nạc)', calories: 145, protein: 21, carbs: 0, fat: 6, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Bắp bò (Nạc)', calories: 201, protein: 21, carbs: 0, fat: 12, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá ngừ đại dương', calories: 130, protein: 28, carbs: 0, fat: 0.6, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Mực ống tươi', calories: 92, protein: 16, carbs: 3, fat: 0.7, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Bạch tuộc', calories: 82, protein: 15, carbs: 2, fat: 1, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Lòng đỏ trứng (Thô)', calories: 55, protein: 2.7, carbs: 0.6, fat: 4.5, unit: 'cái', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Đậu nành (Hạt khô)', calories: 446, protein: 36, carbs: 30, fat: 20, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Đậu Hà Lan', calories: 81, protein: 5, carbs: 14, fat: 0.4, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Phô mai tươi (Cottage Cheese)', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Hàu tươi', calories: 68, protein: 7, carbs: 4, fat: 2.5, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cua biển', calories: 103, protein: 19, carbs: 0, fat: 0.6, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá basa', calories: 125, protein: 17, carbs: 0, fat: 5.5, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Hạnh nhân sữa (Milk Almond)', calories: 50, protein: 1, carbs: 1, fat: 3, unit: '100ml', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Tempeh (Tương nén)', calories: 192, protein: 19, carbs: 9, fat: 11, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Lươn (Thô)', calories: 285, protein: 18.7, carbs: 0, fat: 22.8, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Ếch (Thô)', calories: 73, protein: 16.4, carbs: 0, fat: 0.3, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Sò huyết', calories: 71, protein: 10.8, carbs: 4.8, fat: 0.9, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Ngao (Nghêu)', calories: 74, protein: 12.8, carbs: 2, fat: 1, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá lóc (Thô)', calories: 97, protein: 18.2, carbs: 0, fat: 2.7, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá diêu hồng (Thô)', calories: 100, protein: 18, carbs: 0, fat: 2.5, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Hến', calories: 45, protein: 4.5, carbs: 5.1, fat: 0.6, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Đậu hũ non (Thô)', calories: 61, protein: 6, carbs: 1.5, fat: 3.5, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Trứng cút (Thô)', calories: 158, protein: 13, carbs: 0.4, fat: 11, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },

    // 2. Nhóm Carb (Tinh bột chậm & Tinh bột nhanh) -> category: 'carb'
    { name: 'Cơm trắng (Thô/Chín)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Yến mạch khô (Thô)', calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Gạo lứt (Thô)', calories: 350, protein: 7.5, carbs: 73, fat: 2.7, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Khoai lang (Thô)', calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Hạt Quinoa (Thô)', calories: 368, protein: 14.1, carbs: 64.2, fat: 6.1, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Ngô ngọt (Bắp)', calories: 86, protein: 3, carbs: 19, fat: 1.2, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Bí đỏ (Bí ngô)', calories: 26, protein: 1, carbs: 6.5, fat: 0.1, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Đậu đỏ (Hạt khô)', calories: 330, protein: 22, carbs: 60, fat: 1.2, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Đậu xanh (Hạt khô)', calories: 347, protein: 24, carbs: 62, fat: 1.2, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Sắn (Khoai mì)', calories: 160, protein: 1.4, carbs: 38, fat: 0.3, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },

    // 2.1. Nhóm Fiber (Chất xơ / Rau củ) -> category: 'fiber'
    { name: 'Bông cải xanh (Thô)', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Măng tây', calories: 20, protein: 2.2, carbs: 3.7, fat: 0.1, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Rau cải chíp', calories: 13, protein: 1.5, carbs: 2, fat: 0.2, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Rau muống', calories: 19, protein: 3.2, carbs: 2, fat: 0.3, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Nấm kim châm', calories: 37, protein: 2.7, carbs: 7, fat: 0.3, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Nấm đùi gà', calories: 35, protein: 3.3, carbs: 5, fat: 0.4, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Củ cải trắng', calories: 16, protein: 0.7, carbs: 3.4, fat: 0.1, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Dưa chuột', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Cà chua', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Rau ngót', calories: 35, protein: 5.3, carbs: 3.4, fat: 0, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Rau dền', calories: 23, protein: 2.5, carbs: 4, fat: 0, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Rau mồng tơi', calories: 14, protein: 2, carbs: 1.5, fat: 0, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Cải bẹ xanh', calories: 15, protein: 1.5, carbs: 2.7, fat: 0, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Cải thảo', calories: 12, protein: 1.1, carbs: 2.2, fat: 0.2, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Mướp đắng (Khổ qua)', calories: 17, protein: 1, carbs: 3.7, fat: 0.2, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Bầu', calories: 14, protein: 0.6, carbs: 3.4, fat: 0, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Bí xanh (Bí đao)', calories: 13, protein: 0.4, carbs: 3, fat: 0, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Giá đỗ', calories: 30, protein: 3.8, carbs: 6, fat: 0.2, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Su hào', calories: 27, protein: 1.7, carbs: 6.2, fat: 0.1, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Củ dền', calories: 43, protein: 1.6, carbs: 9.6, fat: 0.2, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Cà rốt', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },

    // 2.3. Nhóm Vitamin (Vitamin & Khoáng chất / Trái cây) -> category: 'vitamin'
    { name: 'Chuối (Thô)', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Táo đỏ', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Quả Việt quất', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Quả Dâu tây', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Đu đủ (Chín)', calories: 43, protein: 0.5, carbs: 10.8, fat: 0.3, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Xoài (Chín)', calories: 60, protein: 0.8, carbs: 15, fat: 0.4, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Dưa hấu', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Thanh long', calories: 60, protein: 1.2, carbs: 13, fat: 0.7, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Bưởi', calories: 38, protein: 0.7, carbs: 9.6, fat: 0, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Ổi', calories: 68, protein: 2.6, carbs: 14.3, fat: 1, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Nho tươi', calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },

    // 3. Nhóm Fat (Chất béo tốt) -> category: 'fat'
    { name: 'Quả Bơ (Thô)', calories: 160, protein: 2, carbs: 8.5, fat: 14.7, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Hạt Hạnh nhân (Thô)', calories: 579, protein: 21.2, carbs: 21.7, fat: 49.9, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Hạt Chia (Thô)', calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Dầu Olive (Thô)', calories: 884, protein: 0, carbs: 0, fat: 100, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Hạt Óc chó', calories: 654, protein: 15, carbs: 14, fat: 65, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Hạt Điều', calories: 553, protein: 18, carbs: 30, fat: 44, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Hạt Bí', calories: 559, protein: 30, carbs: 11, fat: 49, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Bơ đậu phộng (Nguyên chất)', calories: 588, protein: 25, carbs: 20, fat: 50, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Dầu Dừa', calories: 862, protein: 0, carbs: 0, fat: 100, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Vừng (Mè)', calories: 573, protein: 17.7, carbs: 23.4, fat: 49.7, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Đậu phộng (Lạc thô)', calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Mỡ heo (Thô)', calories: 900, protein: 0, carbs: 0, fat: 100, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Hạt Macca', calories: 718, protein: 7.9, carbs: 13.8, fat: 75.8, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Quả Ô liu', calories: 115, protein: 0.8, carbs: 6.3, fat: 10.7, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
];

const dishes = [
    // 4. Nhóm Món ăn chế biến (Dùng để gợi ý)
    { name: 'Salad Ức gà áp chảo', calories: 320, protein: 35, carbs: 12, fat: 14, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm gạo lứt thịt bò', calories: 450, protein: 28, carbs: 55, fat: 12, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh mì ngũ cốc trứng', calories: 310, protein: 14, carbs: 35, fat: 12, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Phở Gà', calories: 400, protein: 25, carbs: 50, fat: 10, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Bò Huế', calories: 520, protein: 22, carbs: 58, fat: 22, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Tấm Sườn', calories: 550, protein: 25, carbs: 70, fat: 20, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Chả', calories: 550, protein: 20, carbs: 65, fat: 25, unit: 'suất', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Đậu Mắm Tôm', calories: 700, protein: 30, carbs: 60, fat: 35, unit: 'suất', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Mì Pate Xá Xíu', calories: 450, protein: 15, carbs: 50, fat: 20, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Miến Lươn', calories: 380, protein: 18, carbs: 45, fat: 12, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Mì Tôm Trứng', calories: 450, protein: 12, carbs: 55, fat: 20, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Xôi Xéo', calories: 450, protein: 10, carbs: 75, fat: 15, unit: 'gói', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Gỏi Cuốn Tôm Thịt', calories: 60, protein: 3, carbs: 10, fat: 1, unit: 'cái', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Cháo Lòng', calories: 320, protein: 15, carbs: 35, fat: 14, unit: 'bát', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Riêu Cua', calories: 420, protein: 15, carbs: 50, fat: 18, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Rang Dưa Bò', calories: 750, protein: 22, carbs: 85, fat: 35, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Cuốn Thịt', calories: 350, protein: 10, carbs: 50, fat: 12, unit: 'đĩa', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Nộm Bò Khô', calories: 280, protein: 14, carbs: 30, fat: 12, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Mọc', calories: 420, protein: 20, carbs: 55, fat: 14, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Miến Gà', calories: 350, protein: 25, carbs: 45, fat: 8, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Cháo Yến Mạch Sữa Tươi', calories: 280, protein: 12, carbs: 40, fat: 8, unit: 'bát', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Cuốn Thanh Trì', calories: 250, protein: 6, carbs: 45, fat: 5, unit: 'đĩa', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Mì Trứng Ốp La', calories: 350, protein: 12, carbs: 40, fat: 15, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Ức Gà Áp Chảo Sốt Chanh Dây', calories: 220, protein: 32, carbs: 10, fat: 5, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Cá Hồi Nướng Măng Tây', calories: 350, protein: 25, carbs: 8, fat: 24, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Salad Bơ Tôm', calories: 280, protein: 18, carbs: 12, fat: 18, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Gà Hải Nam', calories: 600, protein: 30, carbs: 70, fat: 22, unit: 'suất', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Phở Bò Tái Lăn', calories: 550, protein: 28, carbs: 50, fat: 26, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Chả Cá', calories: 450, protein: 22, carbs: 60, fat: 14, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Canh Chua Cá Lóc', calories: 150, protein: 15, carbs: 12, fat: 5, unit: 'bát', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Thịt Kho Trứng', calories: 450, protein: 20, carbs: 15, fat: 35, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Đậu Hũ Nhồi Thịt Sốt Cà', calories: 280, protein: 16, carbs: 10, fat: 18, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Gà Xào Sả Ớt', calories: 320, protein: 25, carbs: 10, fat: 20, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Bò Xào Cần Tây', calories: 300, protein: 24, carbs: 10, fat: 18, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Canh Khổ Qua Nhồi Thịt', calories: 200, protein: 15, carbs: 8, fat: 12, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Rau Muống Xào Tỏi', calories: 120, protein: 3, carbs: 6, fat: 10, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Trứng Đúc Thịt', calories: 350, protein: 18, carbs: 5, fat: 28, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Đùi Gà Rô Ti', calories: 400, protein: 22, carbs: 15, fat: 28, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true }
];

async function seedFoods() {
    try {
        await sequelize.authenticate();
        console.log('✅  Kết nối database thành công.');

        // Đồng bộ cấu trúc bảng
        console.log('🔄  Đang đồng bộ cấu trúc bảng foods...');
        await Food.sync({ alter: true });
        console.log('✅  Đồng bộ xong.');

        // Vô hiệu hóa kiểm tra khóa ngoại (Foreign Key)
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        
        console.log('⚠️   Tiến hành xóa toàn bộ dữ liệu Foods cũ...');
        await sequelize.queryInterface.bulkDelete('foods', null, {});
        
        // Bật lại kiểm tra khóa ngoại
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

        const now = new Date();
        const allFoods = [...rawFoods, ...dishes].map((f) => ({
            ...f,
            createdAt: now,
            updatedAt: now,
        }));

        const inserted = await Food.bulkCreate(allFoods, { validate: true });
        console.log(`🎉  Seed thành công: ${inserted.length} món ăn đã được thêm vào bảng foods.`);

        const summary = {};
        allFoods.forEach((f) => {
            summary[f.foodType] = (summary[f.foodType] || 0) + 1;
        });
        console.log('\n📊  Tóm tắt theo loại (foodType):');
        Object.entries(summary).forEach(([type, count]) => {
            console.log(`     ${type.padEnd(10)}: ${count} món`);
        });

    } catch (error) {
        console.error('❌  Seed thất bại:', error.message);
        if (error.errors) {
            error.errors.forEach((e) => console.error('   -', e.message));
        }
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('\n🔒  Đã đóng kết nối database.');
    }
}

seedFoods();
