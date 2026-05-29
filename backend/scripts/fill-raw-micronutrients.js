'use strict';
/**
 * fill-raw-micronutrients.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Bổ sung toàn bộ vitaminA, vitaminC, calcium, iron, fiber, sugar, sodium 
 * cho tất cả thực phẩm thô (foodType = 'raw') trong database.
 * Sử dụng bảng dữ liệu chuẩn dựa trên Bảng thành phần thực phẩm VN và nguồn tin cậy.
 * Có cơ chế tự động fallback theo danh mục nếu thực phẩm không khớp tên.
 *
 * Chạy: node scripts/fill-raw-micronutrients.js
 */

require('dotenv').config();
const { Food, sequelize } = require('../models');

// Từ điển vi chất cho 123 thực phẩm thô hệ thống (tính trên 100g)
// Đơn vị: vitaminA (µg RAE), vitaminC (mg), calcium (mg), iron (mg), fiber (g), sugar (g), sodium (mg)
const RAW_DICTIONARY = {
    // ── NHÓM ĐẠM THÔ (PROTEIN RAW) ──
    'Ức gà (Thô)': { vitaminA: 5, vitaminC: 0, calcium: 15, iron: 1.0, fiber: 0, sugar: 0, sodium: 74 },
    'Thịt bò thăn (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 18, iron: 2.6, fiber: 0, sugar: 0, sodium: 72 },
    'Cá hồi tươi (Thô)': { vitaminA: 12, vitaminC: 0, calcium: 9, iron: 0.3, fiber: 0, sugar: 0, sodium: 59 },
    'Cá rô phi (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 10, iron: 0.6, fiber: 0, sugar: 0, sodium: 56 },
    'Tôm tươi (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 52, iron: 0.5, fiber: 0, sugar: 0, sodium: 111 },
    'Lòng trắng trứng (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 7, iron: 0.1, fiber: 0, sugar: 0, sodium: 166 },
    'Đậu phụ (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 350, iron: 5.4, fiber: 0.3, sugar: 0.5, sodium: 9 },
    'Sữa chua Hy Lạp (Thô)': { vitaminA: 14, vitaminC: 0, calcium: 110, iron: 0.1, fiber: 0, sugar: 3.2, sodium: 36 },
    'Thịt đùi gà (Bỏ da)': { vitaminA: 15, vitaminC: 0, calcium: 11, iron: 1.3, fiber: 0, sugar: 0, sodium: 90 },
    'Thịt lợn thăn (Nạc)': { vitaminA: 2, vitaminC: 0, calcium: 19, iron: 1.2, fiber: 0, sugar: 0, sodium: 53 },
    'Bắp bò (Nạc)': { vitaminA: 0, vitaminC: 0, calcium: 21, iron: 3.0, fiber: 0, sugar: 0, sodium: 55 },
    'Cá ngừ đại dương': { vitaminA: 655, vitaminC: 0, calcium: 17, iron: 1.5, fiber: 0, sugar: 0, sodium: 50 },
    'Mực ống tươi': { vitaminA: 0, vitaminC: 0, calcium: 14, iron: 0.7, fiber: 0, sugar: 0, sodium: 230 },
    'Bạch tuộc': { vitaminA: 0, vitaminC: 0, calcium: 14, iron: 0.7, fiber: 0, sugar: 0, sodium: 230 },
    'Lòng đỏ trứng (Thô)': { vitaminA: 381, vitaminC: 0, calcium: 129, iron: 2.7, fiber: 0, sugar: 0.1, sodium: 14 },
    'Đậu nành (Hạt khô)': { vitaminA: 1, vitaminC: 6.0, calcium: 277, iron: 15.7, fiber: 9.3, sugar: 7.3, sodium: 2 },
    'Đậu Hà Lan': { vitaminA: 38, vitaminC: 40.0, calcium: 25, iron: 1.5, fiber: 5.1, sugar: 5.7, sodium: 5 },
    'Phô mai tươi (Cottage Cheese)': { vitaminA: 37, vitaminC: 0, calcium: 83, iron: 0.1, fiber: 0, sugar: 2.7, sodium: 364 },
    'Hàu tươi': { vitaminA: 0, vitaminC: 0, calcium: 62, iron: 5.6, fiber: 0, sugar: 0, sodium: 211 },
    'Cua biển': { vitaminA: 0, vitaminC: 0, calcium: 89, iron: 0.8, fiber: 0, sugar: 0, sodium: 293 },
    'Cá basa': { vitaminA: 0, vitaminC: 0, calcium: 10, iron: 0.5, fiber: 0, sugar: 0, sodium: 50 },
    'Tempeh (Tương nén)': { vitaminA: 0, vitaminC: 0, calcium: 111, iron: 2.7, fiber: 9.0, sugar: 0, sodium: 9 },
    'Lươn (Thô)': { vitaminA: 50, vitaminC: 0, calcium: 39, iron: 1.6, fiber: 0, sugar: 0, sodium: 60 },
    'Ếch (Thô)': { vitaminA: 15, vitaminC: 0, calcium: 18, iron: 1.5, fiber: 0, sugar: 0, sodium: 58 },
    'Sò huyết': { vitaminA: 0, vitaminC: 0, calcium: 133, iron: 4.8, fiber: 0, sugar: 0, sodium: 200 },
    'Ngao (Nghêu)': { vitaminA: 0, vitaminC: 0, calcium: 46, iron: 14.0, fiber: 0, sugar: 0, sodium: 200 },
    'Cá lóc (Thô)': { vitaminA: 15, vitaminC: 0, calcium: 90, iron: 0.9, fiber: 0, sugar: 0, sodium: 60 },
    'Cá diêu hồng (Thô)': { vitaminA: 10, vitaminC: 0, calcium: 30, iron: 0.8, fiber: 0, sugar: 0, sodium: 50 },
    'Hến': { vitaminA: 0, vitaminC: 0, calcium: 144, iron: 4.1, fiber: 0, sugar: 0, sodium: 150 },
    'Đậu hũ non (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 120, iron: 1.5, fiber: 0.3, sugar: 0.3, sodium: 10 },
    'Trứng cút (Thô)': { vitaminA: 156, vitaminC: 0, calcium: 64, iron: 3.7, fiber: 0, sugar: 0.4, sodium: 141 },
    'Thịt vịt (Nạc)': { vitaminA: 14, vitaminC: 0, calcium: 11, iron: 2.4, fiber: 0, sugar: 0, sodium: 74 },
    'Cá thu (Thô)': { vitaminA: 47, vitaminC: 0, calcium: 15, iron: 1.6, fiber: 0, sugar: 0, sodium: 83 },
    'Cá chép (Thô)': { vitaminA: 15, vitaminC: 0, calcium: 41, iron: 0.9, fiber: 0, sugar: 0, sodium: 56 },
    'Thịt thỏ (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 12, iron: 1.5, fiber: 0, sugar: 0, sodium: 47 },
    'Tôm sú (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 52, iron: 0.5, fiber: 0, sugar: 0, sodium: 170 },
    'Cá trích (Thô)': { vitaminA: 12, vitaminC: 0, calcium: 57, iron: 1.1, fiber: 0, sugar: 0, sodium: 90 },
    'Sữa tươi không đường': { vitaminA: 46, vitaminC: 0, calcium: 113, iron: 0, fiber: 0, sugar: 5.0, sodium: 44 },
    'Trứng gà (Thô)': { vitaminA: 160, vitaminC: 0, calcium: 50, iron: 1.2, fiber: 0, sugar: 0.6, sodium: 124 },

    // ── NHÓM TINH BỘT THÔ (CARB RAW) ──
    'Cơm trắng (Thô/Chín)': { vitaminA: 0, vitaminC: 0, calcium: 10, iron: 0.2, fiber: 0.4, sugar: 0, sodium: 1 },
    'Yến mạch khô (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 54, iron: 4.7, fiber: 10.6, sugar: 0.9, sodium: 2 },
    'Gạo lứt (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 10, iron: 1.4, fiber: 3.5, sugar: 0.9, sodium: 7 },
    'Khoai lang (Thô)': { vitaminA: 709, vitaminC: 2.4, calcium: 30, iron: 0.6, fiber: 3.0, sugar: 4.2, sodium: 55 },
    'Hạt Quinoa (Thô)': { vitaminA: 1, vitaminC: 0, calcium: 47, iron: 4.6, fiber: 7.0, sugar: 1.6, sodium: 5 },
    'Ngô ngọt (Bắp)': { vitaminA: 9, vitaminC: 6.8, calcium: 2, iron: 0.5, fiber: 2.0, sugar: 3.2, sodium: 15 },
    'Bí đỏ (Bí ngô)': { vitaminA: 426, vitaminC: 9.0, calcium: 21, iron: 0.8, fiber: 0.5, sugar: 2.8, sodium: 1 },
    'Đậu đỏ (Hạt khô)': { vitaminA: 0, vitaminC: 4.5, calcium: 28, iron: 5.0, fiber: 15.2, sugar: 2.1, sodium: 24 },
    'Đậu xanh (Hạt khô)': { vitaminA: 6, vitaminC: 4.8, calcium: 132, iron: 6.7, fiber: 7.6, sugar: 9.0, sodium: 15 },
    'Sắn (Khoai mì)': { vitaminA: 0, vitaminC: 20.6, calcium: 16, iron: 0.3, fiber: 1.8, sugar: 1.7, sodium: 14 },
    'Khoai tây (Thô)': { vitaminA: 0, vitaminC: 19.7, calcium: 12, iron: 0.8, fiber: 2.2, sugar: 0.8, sodium: 6 },
    'Khoai môn (Thô)': { vitaminA: 0, vitaminC: 9.0, calcium: 43, iron: 0.6, fiber: 4.1, sugar: 0.4, sodium: 11 },
    'Bún khô (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 10, iron: 0.2, fiber: 0.3, sugar: 0, sodium: 5 },
    'Mì sợi khô (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 22, iron: 1.4, fiber: 3.2, sugar: 2.7, sodium: 6 },
    'Bánh tráng (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 10, iron: 0.2, fiber: 0.9, sugar: 0.3, sodium: 400 },
    'Bánh mì nguyên cám': { vitaminA: 0, vitaminC: 0, calcium: 40, iron: 2.5, fiber: 6.0, sugar: 4.0, sodium: 450 },
    'Bánh mì đen': { vitaminA: 0, vitaminC: 0, calcium: 30, iron: 2.8, fiber: 5.8, sugar: 3.8, sodium: 480 },
    'Bánh thuyền gạo lứt': { vitaminA: 0, vitaminC: 0, calcium: 15, iron: 1.2, fiber: 3.0, sugar: 1.0, sodium: 120 },

    // ── NHÓM RAU CỦ THÔ (FIBER RAW) ──
    'Bông cải xanh (Thô)': { vitaminA: 31, vitaminC: 89.2, calcium: 47, iron: 0.7, fiber: 2.6, sugar: 1.7, sodium: 33 },
    'Măng tây': { vitaminA: 38, vitaminC: 5.6, calcium: 24, iron: 2.1, fiber: 2.1, sugar: 1.9, sodium: 2 },
    'Rau cải chíp': { vitaminA: 223, vitaminC: 45.0, calcium: 105, iron: 0.8, fiber: 1.0, sugar: 1.2, sodium: 65 },
    'Rau muống': { vitaminA: 315, vitaminC: 55.0, calcium: 77, iron: 1.7, fiber: 2.1, sugar: 0.5, sodium: 113 },
    'Nấm kim châm': { vitaminA: 0, vitaminC: 0, calcium: 5, iron: 1.2, fiber: 2.7, sugar: 1.5, sodium: 2 },
    'Nấm đùi gà': { vitaminA: 0, vitaminC: 0, calcium: 8, iron: 0.7, fiber: 1.7, sugar: 1.1, sodium: 9 },
    'Củ cải trắng': { vitaminA: 0, vitaminC: 14.8, calcium: 25, iron: 0.4, fiber: 1.6, sugar: 2.0, sodium: 39 },
    'Dưa chuột': { vitaminA: 5, vitaminC: 2.8, calcium: 16, iron: 0.3, fiber: 0.5, sugar: 1.7, sodium: 2 },
    'Cà chua': { vitaminA: 42, vitaminC: 13.7, calcium: 10, iron: 0.3, fiber: 1.2, sugar: 2.6, sodium: 5 },
    'Rau ngót': { vitaminA: 600, vitaminC: 130.0, calcium: 169, iron: 2.7, fiber: 2.5, sugar: 0.4, sodium: 33 },
    'Rau dền': { vitaminA: 146, vitaminC: 43.0, calcium: 215, iron: 2.3, fiber: 2.2, sugar: 0, sodium: 23 },
    'Rau mồng tơi': { vitaminA: 200, vitaminC: 72.0, calcium: 109, iron: 1.6, fiber: 1.5, sugar: 0, sodium: 24 },
    'Cải bẹ xanh': { vitaminA: 150, vitaminC: 70.0, calcium: 105, iron: 1.5, fiber: 1.8, sugar: 1.3, sodium: 27 },
    'Cải thảo': { vitaminA: 15, vitaminC: 26.0, calcium: 40, iron: 0.3, fiber: 1.0, sugar: 1.2, sodium: 9 },
    'Mướp đắng (Khổ qua)': { vitaminA: 11, vitaminC: 84.0, calcium: 19, iron: 0.4, fiber: 2.8, sugar: 1.9, sodium: 5 },
    'Bầu': { vitaminA: 0, vitaminC: 10.0, calcium: 20, iron: 0.2, fiber: 0.5, sugar: 2.0, sodium: 3 },
    'Bí xanh (Bí đao)': { vitaminA: 0, vitaminC: 16.0, calcium: 19, iron: 0.4, fiber: 1.0, sugar: 1.5, sodium: 8 },
    'Giá đỗ': { vitaminA: 5, vitaminC: 13.0, calcium: 32, iron: 0.9, fiber: 1.8, sugar: 2.0, sodium: 6 },
    'Su hào': { vitaminA: 0, vitaminC: 62.0, calcium: 24, iron: 0.4, fiber: 3.6, sugar: 2.5, sodium: 20 },
    'Củ dền': { vitaminA: 2, vitaminC: 4.9, calcium: 16, iron: 0.8, fiber: 2.8, sugar: 6.8, sodium: 78 },
    'Cà rốt': { vitaminA: 835, vitaminC: 5.9, calcium: 33, iron: 0.3, fiber: 2.8, sugar: 4.7, sodium: 69 },
    'Rau xà lách': { vitaminA: 370, vitaminC: 9.2, calcium: 36, iron: 0.9, fiber: 1.3, sugar: 0.8, sodium: 28 },
    'Cải xoăn (Kale)': { vitaminA: 241, vitaminC: 120.0, calcium: 254, iron: 1.5, fiber: 3.6, sugar: 0, sodium: 53 },
    'Ớt chuông': { vitaminA: 157, vitaminC: 127.7, calcium: 7, iron: 0.4, fiber: 2.1, sugar: 4.2, sodium: 4 },
    'Rau chân vịt (Spinach)': { vitaminA: 469, vitaminC: 28.1, calcium: 99, iron: 2.7, fiber: 2.2, sugar: 0.4, sodium: 79 },
    'Nấm hương khô': { vitaminA: 0, vitaminC: 0, calcium: 50, iron: 5.6, fiber: 28.2, sugar: 2.5, sodium: 19 },

    // ── NHÓM TRÁI CÂY (VITAMIN RAW) ──
    'Chuối (Thô)': { vitaminA: 3, vitaminC: 8.7, calcium: 5, iron: 0.3, fiber: 2.6, sugar: 12.2, sodium: 1 },
    'Táo đỏ': { vitaminA: 3, vitaminC: 4.6, calcium: 6, iron: 0.1, fiber: 2.4, sugar: 10.4, sodium: 1 },
    'Quả Việt quất': { vitaminA: 3, vitaminC: 9.7, calcium: 6, iron: 0.3, fiber: 2.4, sugar: 9.9, sodium: 1 },
    'Quả Dâu tây': { vitaminA: 1, vitaminC: 58.8, calcium: 16, iron: 0.4, fiber: 2.0, sugar: 4.9, sodium: 1 },
    'Đu đủ (Chín)': { vitaminA: 47, vitaminC: 60.9, calcium: 20, iron: 0.3, fiber: 1.7, sugar: 7.8, sodium: 8 },
    'Xoài (Chín)': { vitaminA: 54, vitaminC: 36.4, calcium: 11, iron: 0.2, fiber: 1.6, sugar: 13.7, sodium: 1 },
    'Dưa hấu': { vitaminA: 28, vitaminC: 8.1, calcium: 7, iron: 0.2, fiber: 0.4, sugar: 6.2, sodium: 1 },
    'Thanh long': { vitaminA: 0, vitaminC: 9.4, calcium: 8, iron: 0.6, fiber: 1.9, sugar: 9.9, sodium: 39 },
    'Bưởi': { vitaminA: 58, vitaminC: 31.2, calcium: 22, iron: 0.1, fiber: 1.6, sugar: 7.0, sodium: 0 },
    'Ổi': { vitaminA: 31, vitaminC: 228.3, calcium: 18, iron: 0.3, fiber: 5.4, sugar: 8.9, sodium: 2 },
    'Nho tươi': { vitaminA: 3, vitaminC: 3.2, calcium: 10, iron: 0.4, fiber: 0.9, sugar: 15.5, sodium: 2 },
    'Cam (Thô)': { vitaminA: 11, vitaminC: 53.2, calcium: 40, iron: 0.1, fiber: 2.4, sugar: 9.4, sodium: 0 },
    'Quýt (Thô)': { vitaminA: 12, vitaminC: 26.7, calcium: 37, iron: 0.1, fiber: 1.8, sugar: 10.6, sodium: 2 },
    'Kiwi': { vitaminA: 4, vitaminC: 92.7, calcium: 34, iron: 0.3, fiber: 3.0, sugar: 9.0, sodium: 3 },
    'Lê': { vitaminA: 1, vitaminC: 4.3, calcium: 9, iron: 0.2, fiber: 3.1, sugar: 9.8, sodium: 1 },
    'Mận (Thô)': { vitaminA: 17, vitaminC: 9.5, calcium: 6, iron: 0.2, fiber: 1.4, sugar: 9.9, sodium: 0 },
    'Dứa (Thơm)': { vitaminA: 3, vitaminC: 47.8, calcium: 13, iron: 0.3, fiber: 1.4, sugar: 9.9, sodium: 1 },
    'Măng cụt': { vitaminA: 0, vitaminC: 2.9, calcium: 12, iron: 0.3, fiber: 1.8, sugar: 16.5, sodium: 7 },
    'Chôm chôm': { vitaminA: 0, vitaminC: 4.9, calcium: 22, iron: 0.3, fiber: 0.9, sugar: 15.7, sodium: 11 },

    // ── NHÓM CHẤT BÉO THÔ (FAT RAW) ──
    'Quả Bơ (Thô)': { vitaminA: 7, vitaminC: 10.0, calcium: 12, iron: 0.5, fiber: 6.7, sugar: 0.7, sodium: 7 },
    'Hạt Hạnh nhân (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 269, iron: 3.7, fiber: 12.5, sugar: 4.4, sodium: 1 },
    'Hạt Chia (Thô)': { vitaminA: 0, vitaminC: 1.6, calcium: 631, iron: 7.7, fiber: 34.4, sugar: 0, sodium: 16 },
    'Dầu Olive (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0, fiber: 0, sugar: 0, sodium: 0 },
    'Hạt Óc chó': { vitaminA: 1, vitaminC: 1.3, calcium: 98, iron: 2.9, fiber: 6.7, sugar: 2.6, sodium: 2 },
    'Hạt Điều': { vitaminA: 0, vitaminC: 0, calcium: 37, iron: 6.7, fiber: 3.3, sugar: 5.9, sodium: 12 },
    'Hạt Bí': { vitaminA: 1, vitaminC: 0, calcium: 46, iron: 8.8, fiber: 6.0, sugar: 1.4, sodium: 7 },
    'Bơ đậu phộng (Nguyên chất)': { vitaminA: 0, vitaminC: 0, calcium: 43, iron: 1.9, fiber: 6.0, sugar: 9.2, sodium: 369 },
    'Dầu Dừa': { vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0, fiber: 0, sugar: 0, sodium: 0 },
    'Vừng (Mè)': { vitaminA: 1, vitaminC: 0, calcium: 975, iron: 14.6, fiber: 11.8, sugar: 0.3, sodium: 11 },
    'Đậu phộng (Lạc thô)': { vitaminA: 0, vitaminC: 0, calcium: 92, iron: 4.6, fiber: 8.5, sugar: 4.0, sodium: 18 },
    'Mỡ heo (Thô)': { vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0, fiber: 0, sugar: 0, sodium: 0 },
    'Hạt Macca': { vitaminA: 0, vitaminC: 1.2, calcium: 85, iron: 3.7, fiber: 8.6, sugar: 4.6, sodium: 5 },
    'Quả Ô liu': { vitaminA: 20, vitaminC: 0.9, calcium: 88, iron: 3.3, fiber: 3.2, sugar: 0, sodium: 1556 },
    'Hạt Hướng dương': { vitaminA: 3, vitaminC: 1.4, calcium: 78, iron: 5.3, fiber: 11.1, sugar: 2.6, sodium: 9 },
    'Hạt Lanh (Flaxseed)': { vitaminA: 0, vitaminC: 0.6, calcium: 255, iron: 5.7, fiber: 27.3, sugar: 1.6, sodium: 30 }
};

// Hàm fallback theo category nếu thực phẩm không khớp hoàn hảo tên trong từ điển
// (Đặc biệt hữu dụng cho các thực phẩm thô tự tạo hoặc biến thể tên gọi)
function getFallbackMicronutrients(food) {
    const category = food.category || 'khac';
    const name = food.name.toLowerCase();

    // Khởi tạo giá trị mặc định bằng 0
    let result = {
        vitaminA: 0,
        vitaminC: 0,
        calcium: 0,
        iron: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0
    };

    // 1. Phân loại theo category
    if (category === 'rau_cu' || category === 'fiber') {
        // Rau củ thô mặc định
        result = { vitaminA: 80, vitaminC: 20, calcium: 40, iron: 1.0, fiber: 2.0, sugar: 1.5, sodium: 30 };
        // Điều chỉnh cho rau màu xanh đậm
        if (name.includes('rau') || name.includes('cải') || name.includes('xoăn')) {
            result.vitaminA = 250;
            result.vitaminC = 60;
            result.calcium = 100;
            result.iron = 1.8;
            result.fiber = 2.2;
        }
        // Điều chỉnh cho nấm
        if (name.includes('nấm')) {
            result.vitaminA = 0;
            result.vitaminC = 0;
            result.calcium = 8;
            result.iron = 1.0;
            result.fiber = 2.5;
        }
    } else if (category === 'protein' || category === 'thit_ca') {
        // Thịt cá đạm thô mặc định
        result = { vitaminA: 5, vitaminC: 0, calcium: 15, iron: 1.2, fiber: 0, sugar: 0, sodium: 70 };
        
        // Hạt đậu đỗ (protein thực vật) chứa nhiều xơ và canxi
        if (name.includes('đậu') || name.includes('đỗ') || name.includes('hạt')) {
            result.vitaminA = 10;
            result.vitaminC = 2;
            result.calcium = 100;
            result.iron = 5.0;
            result.fiber = 8.0;
            result.sugar = 4.0;
        }
        // Trứng
        if (name.includes('trứng')) {
            result.vitaminA = 160;
            result.vitaminC = 0;
            result.calcium = 50;
            result.iron = 1.2;
            result.fiber = 0;
            result.sugar = 0.5;
            result.sodium = 120;
        }
        // Thủy hải sản
        if (name.includes('tôm') || name.includes('cua') || name.includes('sò') || name.includes('ngao') || name.includes('hến') || name.includes('hải sản')) {
            result.vitaminA = 0;
            result.vitaminC = 0;
            result.calcium = 80;
            result.iron = 3.0;
            result.sodium = 200;
        }
    } else if (category === 'carb') {
        // Tinh bột thô mặc định
        result = { vitaminA: 0, vitaminC: 0, calcium: 15, iron: 0.8, fiber: 2.0, sugar: 1.0, sodium: 10 };
        
        // Khoai sắn bí đỏ
        if (name.includes('khoai') || name.includes('sắn') || name.includes('bí đỏ') || name.includes('bí ngô')) {
            result.vitaminA = 200;
            result.vitaminC = 10;
            result.calcium = 25;
            result.iron = 0.6;
            result.fiber = 2.5;
            result.sugar = 3.0;
        }
        // Bánh mì, bánh tráng
        if (name.includes('bánh mì') || name.includes('bánh tráng')) {
            result.calcium = 25;
            result.iron = 1.5;
            result.fiber = 4.0;
            result.sugar = 2.0;
            result.sodium = 400;
        }
    } else if (category === 'trai_cay' || category === 'vitamin') {
        // Trái cây thô mặc định
        result = { vitaminA: 30, vitaminC: 40, calcium: 15, iron: 0.3, fiber: 2.0, sugar: 10.0, sodium: 2 };
        if (name.includes('ổi') || name.includes('dâu') || name.includes('cam') || name.includes('quýt') || name.includes('kiwi')) {
            result.vitaminC = 80;
        }
    } else if (category === 'fat') {
        // Chất béo thô mặc định
        result = { vitaminA: 0, vitaminC: 0, calcium: 10, iron: 0.5, fiber: 0, sugar: 0, sodium: 5 };
        
        // Các loại hạt béo (hạnh nhân, óc chó, chia, mè...)
        if (name.includes('hạt') || name.includes('mè') || name.includes('vừng') || name.includes('lạc') || name.includes('đậu phộng') || name.includes('điều') || name.includes('macca') || name.includes('bí') || name.includes('lanh')) {
            result.calcium = 150;
            result.iron = 4.0;
            result.fiber = 10.0;
            result.sugar = 2.0;
            result.sodium = 10;
        }
        // Dầu tinh chất hoặc mỡ heo
        if (name.includes('dầu') || name.includes('mỡ')) {
            result = { vitaminA: 0, vitaminC: 0, calcium: 0, iron: 0, fiber: 0, sugar: 0, sodium: 0 };
        }
        // Quả bơ
        if (name.includes('bơ')) {
            result = { vitaminA: 7, vitaminC: 10, calcium: 12, iron: 0.5, fiber: 6.7, sugar: 0.7, sodium: 7 };
        }
    }

    return result;
}

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công.');

        // Tìm tất cả thực phẩm thô
        const rawFoods = await Food.findAll({
            where: { foodType: 'raw' }
        });

        console.log(`📋 Phát hiện ${rawFoods.length} thực phẩm thô trong hệ thống.`);

        let countDirectMatch = 0;
        let countFallbackMatch = 0;
        let countUpdated = 0;

        for (const food of rawFoods) {
            let microData = null;

            // 1. Tìm trong từ điển khớp chính xác
            if (RAW_DICTIONARY[food.name]) {
                microData = RAW_DICTIONARY[food.name];
                countDirectMatch++;
            } else {
                // 2. Tìm tương đối trong từ điển (ví dụ: 'Trứng gà (Thô)' tương tự 'Trứng gà')
                const dictNameMatch = Object.keys(RAW_DICTIONARY).find(k => 
                    food.name.toLowerCase().includes(k.toLowerCase()) || 
                    k.toLowerCase().includes(food.name.toLowerCase())
                );
                if (dictNameMatch) {
                    microData = RAW_DICTIONARY[dictNameMatch];
                    countDirectMatch++;
                }
            }

            // 3. Fallback theo category nếu không khớp
            if (!microData) {
                microData = getFallbackMicronutrients(food);
                countFallbackMatch++;
                console.log(`   ⚠️ Không tìm thấy vi chất cụ thể cho "${food.name}", sử dụng dữ liệu mặc định của nhóm: ${food.category}`);
            }

            // Áp dụng cập nhật
            // Chỉ cập nhật nếu có thay đổi hoặc bổ sung giá trị null
            const updates = {};
            const fields = ['vitaminA', 'vitaminC', 'calcium', 'iron', 'fiber', 'sugar', 'sodium'];
            let shouldUpdate = false;

            for (const field of fields) {
                // Nếu dữ liệu hiện tại bị null, hoặc chúng ta muốn đồng bộ lại chuẩn
                if (food[field] === null || food[field] === undefined) {
                    updates[field] = microData[field];
                    shouldUpdate = true;
                }
            }

            if (shouldUpdate) {
                await food.update(updates);
                countUpdated++;
            }
        }

        console.log('\n=== KẾT QUẢ THỰC THI ===');
        console.log(`- Thực phẩm thô khớp từ điển chuẩn: ${countDirectMatch}`);
        console.log(`- Thực phẩm thô dùng thuật toán ước lượng: ${countFallbackMatch}`);
        console.log(`- Số thực phẩm thô đã được cập nhật thành công: ${countUpdated}/${rawFoods.length}`);

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
