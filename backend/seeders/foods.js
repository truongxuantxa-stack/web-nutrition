'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Food } = require('../models');

const tagMap = {
    // --- Protein ---
    'Ức gà (Thô)': ['traditional', 'healthy_bowl'],
    'Thịt bò thăn (Thô)': ['traditional', 'healthy_bowl'],
    'Cá hồi tươi (Thô)': ['healthy_bowl'],
    'Cá rô phi (Thô)': ['traditional'],
    'Tôm tươi (Thô)': ['traditional', 'healthy_bowl'],
    'Lòng trắng trứng (Thô)': ['healthy_bowl', 'snack'],
    'Đậu phụ (Thô)': ['traditional', 'healthy_bowl'],
    'Sữa chua Hy Lạp (Thô)': ['healthy_bowl', 'snack'],
    'Thịt đùi gà (Bỏ da)': ['traditional'],
    'Thịt lợn thăn (Nạc)': ['traditional'],
    'Bắp bò (Nạc)': ['traditional'],
    'Cá ngừ đại dương': ['healthy_bowl'],
    'Mực ống tươi': ['traditional'],
    'Bạch tuộc': ['traditional'],
    'Lòng đỏ trứng (Thô)': ['traditional'], // fallback if not in map is fine, but I can omit
    'Đậu nành (Hạt khô)': ['healthy_bowl'],
    'Phô mai tươi (Cottage Cheese)': ['healthy_bowl', 'snack'],
    'Thịt vịt (Nạc)': ['traditional'],
    'Cá thu (Thô)': ['traditional'],
    'Cá chép (Thô)': ['traditional'],
    'Tôm sú (Thô)': ['traditional'],
    'Sữa tươi không đường': ['healthy_bowl', 'snack'],
    'Cá basa': ['traditional'],
    'Tempeh (Tương nén)': ['healthy_bowl'],
    'Lươn (Thô)': ['traditional'],
    'Ếch (Thô)': ['traditional'],
    'Cá lóc (Thô)': ['traditional'],
    'Cá diêu hồng (Thô)': ['traditional'],
    'Đậu hũ non (Thô)': ['traditional', 'healthy_bowl'],
    'Trứng gà (Thô)': ['traditional', 'healthy_bowl', 'snack'],
    'Trứng cút (Thô)': ['traditional', 'healthy_bowl', 'snack'],
    'Trứng vịt (Thô)': ['traditional'],

    // --- Carb ---
    'Cơm trắng (Thô/Chín)': ['traditional'],
    'Yến mạch khô (Thô)': ['healthy_bowl', 'snack'],
    'Gạo lứt (Thô)': ['healthy_bowl'],
    'Khoai lang (Thô)': ['traditional', 'healthy_bowl', 'snack'],
    'Hạt Quinoa (Thô)': ['healthy_bowl'],
    'Ngô ngọt (Bắp)': ['traditional', 'healthy_bowl'],
    'Bí đỏ (Bí ngô)': ['traditional'],
    'Đậu đỏ (Hạt khô)': ['traditional'],
    'Đậu xanh (Hạt khô)': ['traditional'],
    'Sắn (Khoai mì)': ['traditional'],
    'Khoai tây (Thô)': ['traditional'],
    'Khoai môn (Thô)': ['traditional'],
    'Bún khô (Thô)': ['traditional'],
    'Mì sợi khô (Thô)': ['traditional'],
    'Bánh tráng (Thô)': ['traditional'],

    // --- Fiber ---
    'Bông cải xanh (Thô)': ['traditional', 'healthy_bowl'],
    'Măng tây': ['traditional', 'healthy_bowl'],
    'Rau cải chíp': ['traditional'],
    'Rau muống': ['traditional'],
    'Cải xoăn (Kale)': ['healthy_bowl'],
    'Rau chân vịt (Spinach)': ['healthy_bowl'],
    'Rau xà lách': ['traditional', 'healthy_bowl'],
    'Ớt chuông': ['healthy_bowl'],
    'Cà chua': ['traditional', 'healthy_bowl'],
    'Dưa chuột': ['traditional', 'healthy_bowl'],
    'Nấm kim châm': ['traditional', 'healthy_bowl'],
    'Nấm đùi gà': ['traditional', 'healthy_bowl'],

    // --- Fat ---
    'Quả Bơ (Thô)': ['healthy_bowl', 'snack'],
    'Hạt Hạnh nhân (Thô)': ['healthy_bowl', 'snack'],
    'Hạt Chia (Thô)': ['healthy_bowl', 'snack'],
    'Dầu Olive (Thô)': ['traditional', 'healthy_bowl'],
    'Hạt Óc chó': ['healthy_bowl', 'snack'],
    'Hạt Điều': ['healthy_bowl', 'snack'],
    'Hạt Bí': ['healthy_bowl', 'snack'],
    'Bơ đậu phộng (Nguyên chất)': ['healthy_bowl', 'snack'],
    'Dầu Dừa': ['traditional'],
    'Vừng (Mè)': ['traditional'],
    'Đậu phộng (Lạc thô)': ['traditional', 'healthy_bowl', 'snack'],
    'Mỡ heo (Thô)': ['traditional'],

    // --- Snack bổ sung ---
    'Sữa Tăng Cơ (Whey Protein)': ['snack', 'healthy_bowl'],
    'Thanh Protein (Protein Bar)': ['snack'],
    'Bánh mì nguyên cám': ['carb', 'healthy_bowl', 'snack'],
    'Bánh mì đen': ['carb', 'healthy_bowl', 'snack'],
    'Bánh thuyền gạo lứt': ['carb', 'healthy_bowl', 'snack'],
    'Sữa đậu nành không đường': ['snack', 'healthy_bowl'],
    'Chuối (Thô)': ['snack'],
    'Táo đỏ': ['snack'],
    'Quả Việt quất': ['snack'],
    'Quả Dâu tây': ['snack'],
    'Hạt Hướng dương': ['fat', 'healthy_bowl', 'snack'],
};

const rawFoods = [
    // 1. Nhóm Protein (Chất đạm sạch) -> category: 'protein'
    { name: 'Ức gà (Thô)', calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Thịt bò thăn (Thô)', calories: 250, protein: 26, carbs: 0, fat: 15, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá hồi tươi (Thô)', calories: 208, protein: 20, carbs: 0, fat: 13, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá rô phi (Thô)', calories: 128, protein: 26, carbs: 0, fat: 2.7, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Tôm tươi (Thô)', calories: 99, protein: 24, carbs: 0, fat: 0.3, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Lòng trắng trứng (Thô)', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false, imageUrl: '/images/foods/long_trang_trung.webp' },
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
    { name: 'Trứng cút (Thô)', calories: 158, protein: 13, carbs: 0.4, fat: 11, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false, imageUrl: '/images/foods/trung_cut.webp' },
    { name: 'Trứng gà (Thô)', calories: 155, protein: 13, carbs: 1.1, fat: 11, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false, imageUrl: '/images/foods/trung_ga.webp' },
    { name: 'Trứng vịt (Thô)', calories: 185, protein: 12.8, carbs: 1.5, fat: 13.8, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },

    // === BỔ SUNG PROTEIN CHO BỮA PHỤ ===
    { name: 'Sữa Tăng Cơ (Whey Protein)', calories: 380, protein: 78, carbs: 6, fat: 4, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false, imageUrl: '/images/foods/sua_tang_co.jfif' },
    { name: 'Thanh Protein (Protein Bar)', calories: 350, protein: 30, carbs: 35, fat: 10, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false, imageUrl: '/images/foods/thanh_protein.jfif' },
    { name: 'Sữa đậu nành không đường', calories: 33, protein: 3.3, carbs: 1.8, fat: 1.6, unit: '100ml', category: 'protein', foodType: 'raw', isSuggestable: false },

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
    { name: 'Bánh mì nguyên cám', calories: 247, protein: 13, carbs: 41.3, fat: 3.4, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Bánh mì đen', calories: 259, protein: 9, carbs: 48, fat: 3.3, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Bánh thuyền gạo lứt', calories: 380, protein: 8, carbs: 80, fat: 3, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },

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
    { name: 'Chuối (Thô)', calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Táo đỏ', calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Quả Việt quất', calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Quả Dâu tây', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
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
    { name: 'Dầu Dừa', calories: 862, protein: 0, carbs: 0, fat: 100, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false, imageUrl: '/images/foods/dau_dua.webp' },
    { name: 'Vừng (Mè)', calories: 573, protein: 17.7, carbs: 23.4, fat: 49.7, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false, imageUrl: '/images/foods/vung_me.jfif' },
    { name: 'Đậu phộng (Lạc thô)', calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Mỡ heo (Thô)', calories: 900, protein: 0, carbs: 0, fat: 100, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Hạt Macca', calories: 718, protein: 7.9, carbs: 13.8, fat: 75.8, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Quả Ô liu', calories: 115, protein: 0.8, carbs: 6.3, fat: 10.7, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },

    // === BỔ SUNG: Protein ===
    { name: 'Thịt vịt (Nạc)', calories: 135, protein: 19, carbs: 0, fat: 6, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá thu (Thô)', calories: 205, protein: 19, carbs: 0, fat: 14, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá chép (Thô)', calories: 127, protein: 18, carbs: 0, fat: 5.6, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Thịt thỏ (Thô)', calories: 136, protein: 20.5, carbs: 0, fat: 5.5, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Tôm sú (Thô)', calories: 85, protein: 20, carbs: 0, fat: 0.5, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Cá trích (Thô)', calories: 158, protein: 18, carbs: 0, fat: 9, unit: '100g', category: 'protein', foodType: 'raw', isSuggestable: false },
    { name: 'Sữa tươi không đường', calories: 42, protein: 3.4, carbs: 5, fat: 1, unit: '100ml', category: 'protein', foodType: 'raw', isSuggestable: false },

    // === BỔ SUNG: Carb ===
    { name: 'Khoai tây (Thô)', calories: 77, protein: 2, carbs: 17, fat: 0.1, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Khoai môn (Thô)', calories: 112, protein: 1.5, carbs: 26.5, fat: 0.2, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Bún khô (Thô)', calories: 360, protein: 3.4, carbs: 82, fat: 0.6, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Mì sợi khô (Thô)', calories: 348, protein: 12, carbs: 72, fat: 1.5, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },
    { name: 'Bánh tráng (Thô)', calories: 320, protein: 1, carbs: 78, fat: 0.2, unit: '100g', category: 'carb', foodType: 'raw', isSuggestable: false },

    // === BỔ SUNG: Fiber ===
    { name: 'Rau xà lách', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Cải xoăn (Kale)', calories: 49, protein: 4.3, carbs: 9, fat: 0.9, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Ớt chuông', calories: 31, protein: 1, carbs: 6, fat: 0.3, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Rau chân vịt (Spinach)', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },
    { name: 'Nấm hương khô', calories: 296, protein: 9.6, carbs: 63.9, fat: 1, unit: '100g', category: 'fiber', foodType: 'raw', isSuggestable: false },

    // === BỔ SUNG: Vitamin (Trái cây) ===
    { name: 'Cam (Thô)', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Quýt (Thô)', calories: 53, protein: 0.8, carbs: 13.3, fat: 0.3, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Kiwi', calories: 61, protein: 1.1, carbs: 15, fat: 0.5, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Lê', calories: 57, protein: 0.4, carbs: 15, fat: 0.1, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Mận (Thô)', calories: 46, protein: 0.7, carbs: 11.4, fat: 0.3, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Dứa (Thơm)', calories: 50, protein: 0.5, carbs: 13.1, fat: 0.1, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Măng cụt', calories: 73, protein: 0.4, carbs: 18, fat: 0.6, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },
    { name: 'Chôm chôm', calories: 82, protein: 0.7, carbs: 20.9, fat: 0.2, unit: '100g', category: 'vitamin', foodType: 'raw', isSuggestable: false },

    // === BỔ SUNG: Fat ===
    { name: 'Hạt Hướng dương', calories: 584, protein: 20.8, carbs: 20, fat: 51.5, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
    { name: 'Hạt Lanh (Flaxseed)', calories: 534, protein: 18.3, carbs: 28.9, fat: 42.2, unit: '100g', category: 'fat', foodType: 'raw', isSuggestable: false },
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
    { name: 'Đùi Gà Rô Ti', calories: 400, protein: 22, carbs: 15, fat: 28, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },

    // === BỔ SUNG: Món Healthy ===
    { name: 'Bowl Cơm Lứt Cá Hồi Bơ', calories: 520, protein: 28, carbs: 50, fat: 22, unit: 'bát', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Salad Quinoa Rau Củ', calories: 280, protein: 10, carbs: 35, fat: 12, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Ức Gà Nướng Mật Ong', calories: 250, protein: 30, carbs: 12, fat: 8, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Cá Ngừ Áp Chảo Salad', calories: 300, protein: 35, carbs: 8, fat: 14, unit: 'đĩa', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Súp Bí Đỏ Kem Tươi', calories: 180, protein: 4, carbs: 25, fat: 7, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Lứt Gà Xé Rau Củ', calories: 420, protein: 25, carbs: 52, fat: 10, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Gạo Lứt Tôm Hấp', calories: 350, protein: 22, carbs: 48, fat: 6, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Salad Trứng Luộc Rau Mầm', calories: 220, protein: 14, carbs: 10, fat: 14, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Tôm Hấp Sả', calories: 120, protein: 22, carbs: 3, fat: 2, unit: 'đĩa', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Cá Diêu Hồng Hấp Hành', calories: 150, protein: 22, carbs: 2, fat: 5, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Gà Luộc Lá Chanh', calories: 200, protein: 28, carbs: 0, fat: 9, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Bò Cuốn Lá Lốt Nướng', calories: 280, protein: 20, carbs: 5, fat: 20, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Đậu Hũ Sốt Nấm', calories: 180, protein: 12, carbs: 10, fat: 10, unit: 'suất', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Cải Bó Xôi Xào Tỏi', calories: 90, protein: 4, carbs: 5, fat: 6, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Bông Cải Xanh Luộc', calories: 55, protein: 4, carbs: 7, fat: 1, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Măng Tây Xào Tôm', calories: 150, protein: 15, carbs: 8, fat: 6, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Canh Rau Ngót Thịt Bằm', calories: 120, protein: 10, carbs: 5, fat: 6, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Canh Bí Đao Tôm Khô', calories: 80, protein: 6, carbs: 8, fat: 2, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Cháo Gà Gạo Lứt', calories: 300, protein: 18, carbs: 40, fat: 7, unit: 'bát', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Yến Mạch Trái Cây Hạt', calories: 350, protein: 10, carbs: 50, fat: 12, unit: 'bát', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Cuộn Rong Biển (Kimbap)', calories: 320, protein: 10, carbs: 48, fat: 8, unit: 'cuộn', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bò Bít Tết Rau Nướng', calories: 450, protein: 35, carbs: 10, fat: 28, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Cá Basa Hấp Gừng', calories: 160, protein: 20, carbs: 2, fat: 7, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Salad Caesar Gà Nướng', calories: 380, protein: 28, carbs: 15, fat: 22, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Wrap Gà Rau Củ', calories: 350, protein: 22, carbs: 35, fat: 12, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Chiên Trứng Rau Củ', calories: 480, protein: 14, carbs: 60, fat: 18, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Phở Chay Rau Nấm', calories: 320, protein: 8, carbs: 55, fat: 6, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Chả Giò Chay', calories: 400, protein: 10, carbs: 58, fat: 14, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Cá Lóc Nướng Trui', calories: 180, protein: 25, carbs: 0, fat: 8, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Thịt Heo Luộc Chấm Mắm', calories: 250, protein: 20, carbs: 0, fat: 18, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Gạo Lứt Cá Kho', calories: 430, protein: 24, carbs: 50, fat: 14, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bowl Poke Cá Hồi', calories: 480, protein: 25, carbs: 52, fat: 18, unit: 'bát', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Bò Xào Rau Củ', calories: 420, protein: 22, carbs: 50, fat: 14, unit: 'đĩa', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Súp Gà Ngô Non', calories: 150, protein: 12, carbs: 15, fat: 4, unit: 'bát', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Súp Hành Tây Phô Mai', calories: 220, protein: 8, carbs: 20, fat: 12, unit: 'bát', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Trứng Hấp Nấm', calories: 130, protein: 10, carbs: 3, fat: 9, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Sandwich Ức Gà Rau Xanh', calories: 320, protein: 22, carbs: 30, fat: 12, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Cá Hấp Xì Dầu Gừng', calories: 170, protein: 22, carbs: 4, fat: 6, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Gà Nướng Ngũ Vị', calories: 280, protein: 30, carbs: 5, fat: 15, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Nấm Đùi Gà Xào Bơ Tỏi', calories: 130, protein: 5, carbs: 6, fat: 9, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Mì Ý Sốt Cà Chua Thịt Bò', calories: 550, protein: 22, carbs: 65, fat: 20, unit: 'đĩa', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Gạo Lứt Tôm Rang', calories: 440, protein: 22, carbs: 52, fat: 14, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Canh Cải Thảo Nấu Tôm', calories: 100, protein: 8, carbs: 6, fat: 4, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Đậu Hũ Chiên Sả Ớt', calories: 220, protein: 12, carbs: 8, fat: 15, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Gỏi Bưởi Tôm Thịt', calories: 180, protein: 12, carbs: 18, fat: 6, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Mì Udon Hải Sản', calories: 420, protein: 18, carbs: 58, fat: 12, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Thịt Nướng Chả Giò', calories: 580, protein: 22, carbs: 65, fat: 24, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Trộn Hàn Quốc (Bibimbap)', calories: 490, protein: 18, carbs: 60, fat: 18, unit: 'bát', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Gà Hấp Muối Sả', calories: 230, protein: 26, carbs: 2, fat: 12, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Canh Bầu Nấu Tôm', calories: 90, protein: 6, carbs: 8, fat: 3, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Bắp Cải Cuốn Thịt Hấp', calories: 200, protein: 15, carbs: 10, fat: 10, unit: 'suất', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Cá Rô Phi Chiên Giòn', calories: 220, protein: 22, carbs: 8, fat: 10, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Salad Bò Thái Lan', calories: 300, protein: 22, carbs: 12, fat: 18, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Nấm Hấp Lá Sen', calories: 380, protein: 8, carbs: 60, fat: 10, unit: 'suất', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Mì Soba Lạnh Rau Củ', calories: 320, protein: 12, carbs: 52, fat: 6, unit: 'đĩa', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Tôm Nướng Muối Ớt', calories: 140, protein: 24, carbs: 3, fat: 3, unit: 'đĩa', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Canh Mồng Tơi Mướp', calories: 45, protein: 2, carbs: 5, fat: 1.5, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Chiên Kimchi', calories: 480, protein: 12, carbs: 62, fat: 18, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Thịt Bò Xào Ớt Chuông', calories: 280, protein: 22, carbs: 8, fat: 18, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Cá Thu Nướng Nghệ', calories: 250, protein: 22, carbs: 3, fat: 16, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Soup Rau Củ Detox', calories: 100, protein: 3, carbs: 18, fat: 2, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Ức Vịt Áp Chảo Sốt Cam', calories: 300, protein: 24, carbs: 12, fat: 16, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Lứt Đậu Hũ Rong Biển', calories: 380, protein: 14, carbs: 55, fat: 10, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Măng Gà', calories: 380, protein: 20, carbs: 48, fat: 12, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Cá Chẽm Hấp Hồng Kông', calories: 180, protein: 24, carbs: 4, fat: 6, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Pancake Chuối Yến Mạch', calories: 280, protein: 8, carbs: 40, fat: 10, unit: 'suất', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Bowl Açaí Trái Cây', calories: 350, protein: 5, carbs: 55, fat: 12, unit: 'bát', category: 'trai_cay', foodType: 'dish', isSuggestable: true },
    { name: 'Rau Củ Hấp Chấm Mắm Nêm', calories: 80, protein: 3, carbs: 12, fat: 2, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Thịt Bò Hầm Khoai Tây Cà Rốt', calories: 400, protein: 25, carbs: 25, fat: 20, unit: 'bát', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Tôm Xào Bông Cải Xanh', calories: 180, protein: 18, carbs: 8, fat: 8, unit: 'đĩa', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Cháo Cá Lóc Rau Đắng', calories: 250, protein: 18, carbs: 30, fat: 5, unit: 'bát', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Nước Lèo Sóc Trăng', calories: 450, protein: 18, carbs: 55, fat: 16, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Sườn Non Om Sấu', calories: 350, protein: 18, carbs: 10, fat: 25, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Gà Xào Hạt Điều', calories: 320, protein: 22, carbs: 12, fat: 20, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Canh Su Hào Nấu Sườn', calories: 160, protein: 10, carbs: 12, fat: 8, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Chả Cá Lã Vọng', calories: 350, protein: 22, carbs: 8, fat: 24, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Mì Quảng', calories: 500, protein: 20, carbs: 58, fat: 20, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Cá Châu Đốc', calories: 420, protein: 18, carbs: 52, fat: 14, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Hủ Tiếu Nam Vang', calories: 480, protein: 20, carbs: 58, fat: 18, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Chiên Dương Châu', calories: 550, protein: 15, carbs: 65, fat: 24, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Gỏi Cuốn Chay', calories: 50, protein: 2, carbs: 10, fat: 0.5, unit: 'cái', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Salad Kale Hạt Quinoa', calories: 260, protein: 10, carbs: 28, fat: 12, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },

    // === BỮA SÁNG ĐƯỜNG PHỐ ===
    { name: 'Bánh Mì Thịt Nguội', calories: 420, protein: 16, carbs: 50, fat: 16, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Mì Ốp La', calories: 380, protein: 14, carbs: 42, fat: 17, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Mì Chảo (Hết thứ)', calories: 650, protein: 28, carbs: 55, fat: 32, unit: 'suất', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Xôi Gà', calories: 480, protein: 22, carbs: 70, fat: 12, unit: 'suất', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Xôi Đậu Xanh', calories: 380, protein: 10, carbs: 72, fat: 6, unit: 'gói', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Xôi Lạc', calories: 420, protein: 14, carbs: 68, fat: 12, unit: 'gói', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Xôi Ngô Mỡ Hành', calories: 450, protein: 9, carbs: 78, fat: 14, unit: 'gói', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Cháo Đậu Xanh', calories: 180, protein: 7, carbs: 35, fat: 1, unit: 'bát', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Cháo Thịt Bằm', calories: 220, protein: 14, carbs: 30, fat: 6, unit: 'bát', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Giò', calories: 320, protein: 10, carbs: 48, fat: 10, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Bao Thịt', calories: 280, protein: 12, carbs: 40, fat: 8, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Bao Chay', calories: 200, protein: 6, carbs: 38, fat: 3, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Ướt Chả Lụa', calories: 280, protein: 12, carbs: 42, fat: 7, unit: 'đĩa', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Hủ Tiếu Khô Thịt', calories: 490, protein: 22, carbs: 60, fat: 18, unit: 'đĩa', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Mì Khô Xá Xíu', calories: 520, protein: 20, carbs: 65, fat: 20, unit: 'đĩa', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Bò Nam Bộ', calories: 480, protein: 24, carbs: 58, fat: 16, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },

    // === CƠM VĂN PHÒNG / CƠM BÌNH DÂN ===
    { name: 'Cơm Sườn Cải', calories: 520, protein: 22, carbs: 68, fat: 18, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Gà Chiên Nước Mắm', calories: 580, protein: 28, carbs: 65, fat: 22, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Bò Kho', calories: 550, protein: 26, carbs: 62, fat: 22, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Canh Chua Cá', calories: 490, protein: 22, carbs: 60, fat: 16, unit: 'suất', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Thịt Kho Tiêu', calories: 530, protein: 24, carbs: 62, fat: 20, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Cá Kho Tộ', calories: 510, protein: 25, carbs: 60, fat: 18, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Trắng + Rau Xào', calories: 320, protein: 6, carbs: 60, fat: 8, unit: 'suất', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Đùi Gà Nướng', calories: 560, protein: 30, carbs: 62, fat: 20, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Chả Trứng', calories: 500, protein: 20, carbs: 65, fat: 18, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Bò Xào Sả', calories: 440, protein: 22, carbs: 52, fat: 16, unit: 'đĩa', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Canh Chua Tôm', calories: 120, protein: 10, carbs: 10, fat: 4, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Đậu Phụ Sốt Thịt Bằm', calories: 240, protein: 18, carbs: 8, fat: 15, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Rau Cải Luộc Chấm Mắm', calories: 50, protein: 2, carbs: 5, fat: 2, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },

    // === ĂN VẶT / BỮA PHỤ ===
    { name: 'Bánh Tráng Nướng Phomai', calories: 280, protein: 8, carbs: 38, fat: 11, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Tráng Trộn', calories: 250, protein: 6, carbs: 42, fat: 7, unit: 'gói', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Khoai Lang Lắc Phô Mai', calories: 220, protein: 4, carbs: 38, fat: 7, unit: 'suất', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Ngô Luộc', calories: 150, protein: 5, carbs: 32, fat: 2, unit: 'bắp', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Khoai Lang Luộc', calories: 130, protein: 2, carbs: 30, fat: 0.1, unit: 'củ 150g', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Chuối Lán', calories: 120, protein: 1.5, carbs: 28, fat: 0.3, unit: 'quả', category: 'trai_cay', foodType: 'dish', isSuggestable: true },
    { name: 'Ổi Xanh Chấm Muối Ớt', calories: 80, protein: 2, carbs: 18, fat: 0.5, unit: 'suất', category: 'trai_cay', foodType: 'dish', isSuggestable: true },
    { name: 'Chè Đậu Xanh', calories: 200, protein: 5, carbs: 40, fat: 2, unit: 'ly', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Chè Ba Màu', calories: 280, protein: 5, carbs: 55, fat: 5, unit: 'ly', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Chè Bưởi Sương Sáo', calories: 180, protein: 1, carbs: 44, fat: 1, unit: 'ly', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Sữa Chua Nếp Cẩm', calories: 220, protein: 5, carbs: 40, fat: 4, unit: 'ly', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Hạt Điều Rang Muối', calories: 165, protein: 5, carbs: 9, fat: 13, unit: 'gói 30g', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Trái Cây Dầm', calories: 150, protein: 1, carbs: 35, fat: 0.5, unit: 'ly', category: 'trai_cay', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Flan', calories: 120, protein: 4, carbs: 18, fat: 4, unit: 'cái', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Sữa Chua Hoa Quả', calories: 130, protein: 5, carbs: 22, fat: 3, unit: 'hộp 100g', category: 'khac', foodType: 'dish', isSuggestable: true },

    // === MÓN MIỀN TRUNG / MIỀN NAM ===
    { name: 'Bún Thái Hải Sản', calories: 420, protein: 22, carbs: 55, fat: 12, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Xèo Tôm Thịt', calories: 350, protein: 14, carbs: 35, fat: 18, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Mì Quảng Gà', calories: 480, protein: 22, carbs: 55, fat: 18, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Cao Lầu Hội An', calories: 520, protein: 20, carbs: 62, fat: 20, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Kèn Phú Quốc', calories: 450, protein: 20, carbs: 54, fat: 16, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Cơm Niêu Sài Gòn', calories: 580, protein: 24, carbs: 72, fat: 20, unit: 'suất', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Lẩu Mắm', calories: 350, protein: 18, carbs: 25, fat: 18, unit: 'suất', category: 'khac', foodType: 'dish', isSuggestable: true },

    // === MÓN LẨU / NƯỚNG ===
    { name: 'Lẩu Thái Hải Sản', calories: 300, protein: 20, carbs: 22, fat: 14, unit: 'suất', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Lẩu Gà Lá Giang', calories: 280, protein: 22, carbs: 18, fat: 12, unit: 'suất', category: 'khac', foodType: 'dish', isSuggestable: true },
    { name: 'Thịt Nướng BBQ Mỡ Hành', calories: 380, protein: 28, carbs: 5, fat: 28, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Gà Nướng Muối Ớt', calories: 300, protein: 28, carbs: 5, fat: 18, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },
    { name: 'Sườn Nướng Mật Ong', calories: 420, protein: 22, carbs: 18, fat: 28, unit: 'suất', category: 'thit_ca', foodType: 'dish', isSuggestable: true },

    // === MÓN CHAY ===
    { name: 'Cơm Chay Thập Cẩm', calories: 420, protein: 12, carbs: 65, fat: 12, unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true },
    { name: 'Bún Chay Sốt Nấm', calories: 320, protein: 8, carbs: 58, fat: 6, unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true },
    { name: 'Bánh Mì Chay', calories: 280, protein: 8, carbs: 48, fat: 6, unit: 'cái', category: 'banh', foodType: 'dish', isSuggestable: true },
    { name: 'Đậu Hũ Kho Sả Ớt', calories: 200, protein: 14, carbs: 8, fat: 12, unit: 'suất', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Canh Rau Củ Chay', calories: 80, protein: 3, carbs: 14, fat: 1.5, unit: 'bát', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
    { name: 'Nấm Xào Rau Củ', calories: 140, protein: 5, carbs: 12, fat: 8, unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true },
];

const beverages = [
    // 5. Nhóm Đồ Uống
    // --- Nước ép trái cây ---
    { name: 'Nước Ép Cam Tươi', calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Ép Dưa Hấu', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Ép Táo', calories: 46, protein: 0.1, carbs: 11.3, fat: 0.1, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Ép Cà Rốt', calories: 40, protein: 0.9, carbs: 9.3, fat: 0.2, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Ép Dứa', calories: 53, protein: 0.4, carbs: 12.9, fat: 0.1, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Ép Ổi', calories: 68, protein: 0.8, carbs: 16, fat: 0.2, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Ép Bưởi', calories: 38, protein: 0.5, carbs: 9, fat: 0.1, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Ép Rau Má', calories: 25, protein: 0.5, carbs: 5.5, fat: 0.1, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Ép Cần Tây', calories: 16, protein: 0.7, carbs: 3, fat: 0.2, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Ép Lựu', calories: 54, protein: 0.2, carbs: 13, fat: 0.1, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Mía', calories: 73, protein: 0.3, carbs: 18, fat: 0, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },

    // --- Sinh tố / Smoothie ---
    { name: 'Sinh Tố Bơ', calories: 200, protein: 3, carbs: 18, fat: 14, unit: 'ly 300ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Sinh Tố Chuối Sữa', calories: 180, protein: 4, carbs: 32, fat: 4, unit: 'ly 300ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Sinh Tố Xoài', calories: 160, protein: 2, carbs: 35, fat: 2, unit: 'ly 300ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Sinh Tố Dâu Tây', calories: 130, protein: 2, carbs: 28, fat: 1.5, unit: 'ly 300ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Smoothie Protein Chuối Yến Mạch', calories: 280, protein: 15, carbs: 40, fat: 6, unit: 'ly 350ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Smoothie Bowl Việt Quất', calories: 250, protein: 6, carbs: 42, fat: 7, unit: 'ly 350ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Sinh Tố Thanh Long Sữa Chua', calories: 150, protein: 4, carbs: 28, fat: 2, unit: 'ly 300ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },

    // --- Sữa & Đồ uống sữa ---
    { name: 'Sữa Milo Nóng', calories: 190, protein: 5, carbs: 30, fat: 5, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Sữa Milo Đá', calories: 210, protein: 5, carbs: 34, fat: 5.5, unit: 'ly 300ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Sữa Đậu Nành', calories: 54, protein: 3.3, carbs: 6, fat: 1.8, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Sữa Tươi Có Đường', calories: 65, protein: 3.3, carbs: 8.5, fat: 1.5, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Sữa Chua Uống', calories: 70, protein: 2.5, carbs: 12, fat: 1.5, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Sữa Hạt Óc Chó', calories: 60, protein: 1.5, carbs: 7, fat: 3, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Sữa Yến Mạch (Oat Milk)', calories: 48, protein: 1, carbs: 9.5, fat: 1.5, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },

    // --- Trà ---
    { name: 'Trà Xanh Không Đường', calories: 2, protein: 0, carbs: 0.5, fat: 0, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Trà Đào Cam Sả', calories: 90, protein: 0.3, carbs: 22, fat: 0, unit: 'ly 350ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Trà Sữa Trân Châu', calories: 350, protein: 3, carbs: 55, fat: 12, unit: 'ly 500ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Trà Chanh Mật Ong', calories: 60, protein: 0.2, carbs: 15, fat: 0, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Trà Gừng Mật Ong', calories: 50, protein: 0.1, carbs: 12, fat: 0, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },

    // --- Cà phê ---
    { name: 'Cà Phê Đen Không Đường', calories: 5, protein: 0.3, carbs: 0, fat: 0, unit: 'ly 150ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Cà Phê Sữa Đá', calories: 120, protein: 2, carbs: 18, fat: 4, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Cappuccino', calories: 120, protein: 4, carbs: 10, fat: 6, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Latte', calories: 150, protein: 5, carbs: 15, fat: 6, unit: 'ly 300ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },

    // --- Nước khác ---
    { name: 'Nước Dừa Tươi', calories: 46, protein: 0.5, carbs: 9.8, fat: 0.5, unit: 'trái', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Chanh Muối', calories: 25, protein: 0.2, carbs: 6, fat: 0, unit: 'ly 250ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Sâm Bổ Lượng', calories: 120, protein: 2, carbs: 28, fat: 0.5, unit: 'ly 350ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
    { name: 'Nước Rau Má Đậu Xanh', calories: 80, protein: 3, carbs: 16, fat: 0.5, unit: 'ly 300ml', category: 'do_uong', foodType: 'dish', isSuggestable: true },
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
        const allFoods = [...rawFoods.map(f => ({ ...f, tags: tagMap[f.name] || ['traditional'] })), ...dishes, ...beverages].map((f) => ({
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
