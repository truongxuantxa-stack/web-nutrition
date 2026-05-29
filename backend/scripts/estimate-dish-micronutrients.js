'use strict';
/**
 * estimate-dish-micronutrients.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Ước tính vitaminA, vitaminC, calcium, iron, fiber cho 226 món ăn chế biến
 * dựa trên category và từ khóa tên món (theo bảng thành phần thực phẩm VN).
 *
 * Nguồn tham khảo: Bảng Thành phần Thực phẩm Việt Nam (Viện Dinh dưỡng, 2016)
 * Đây là GIÁ TRỊ ƯỚC TÍNH — không phải phân tích phòng thí nghiệm.
 *
 * Chạy: node scripts/estimate-dish-micronutrients.js
 */

require('dotenv').config();
const { Food } = require('../models');

// ─── Giá trị mặc định vi chất theo category (tính cho 1 suất ăn thực tế) ────
// Đơn vị: vitaminA (µg RAE), vitaminC (mg), calcium (mg), iron (mg), fiber (g)
const CATEGORY_DEFAULTS = {
    com      : { vitaminA: 25,  vitaminC: 3,   calcium: 45,  iron: 1.5,  fiber: 1.5 },
    pho_bun  : { vitaminA: 30,  vitaminC: 5,   calcium: 55,  iron: 2.0,  fiber: 1.8 },
    banh     : { vitaminA: 15,  vitaminC: 1,   calcium: 60,  iron: 1.2,  fiber: 1.0 },
    rau_cu   : { vitaminA: 180, vitaminC: 22,  calcium: 80,  iron: 1.8,  fiber: 3.0 },
    thit_ca  : { vitaminA: 45,  vitaminC: 4,   calcium: 55,  iron: 2.5,  fiber: 0.5 },
    do_uong  : { vitaminA: 5,   vitaminC: 8,   calcium: 30,  iron: 0.3,  fiber: 0.2 },
    trai_cay : { vitaminA: 60,  vitaminC: 35,  calcium: 20,  iron: 0.5,  fiber: 2.5 },
    khac     : { vitaminA: 20,  vitaminC: 4,   calcium: 50,  iron: 1.0,  fiber: 1.2 },
};

// ─── Điều chỉnh theo từ khóa trong tên món ────────────────────────────────────
// Nếu tên có chứa từ khóa → cộng/nhân thêm vi chất tương ứng
const KEYWORD_BOOSTS = [
    // Rau xanh → nhiều vitaminA, C, calcium
    { keywords: ['rau', 'cải', 'rau muống', 'rau ngót', 'rau dền', 'bắp cải', 'súp lơ', 'bông cải'],
      boost: { vitaminA: 120, vitaminC: 15, calcium: 40, iron: 0.8, fiber: 1.5 } },

    // Cà rốt, bí → nhiều vitaminA
    { keywords: ['cà rốt', 'bí đao', 'bí đỏ', 'bí ngô', 'khoai lang'],
      boost: { vitaminA: 200, vitaminC: 8, calcium: 20, iron: 0.5, fiber: 1.0 } },

    // Cà chua → nhiều vitaminC
    { keywords: ['cà chua', 'canh chua', 'canh'],
      boost: { vitaminA: 30, vitaminC: 12, calcium: 15, iron: 0.3, fiber: 0.8 } },

    // Thịt bò → nhiều sắt
    { keywords: ['bò', 'beef', 'thịt bò'],
      boost: { vitaminA: 0, vitaminC: 0, calcium: 5, iron: 1.5, fiber: 0 } },

    // Gan → cực nhiều vitaminA và sắt
    { keywords: ['gan'],
      boost: { vitaminA: 3000, vitaminC: 5, calcium: 10, iron: 8, fiber: 0 } },

    // Tôm, cua, hải sản → calcium cao
    { keywords: ['tôm', 'cua', 'cá', 'mực', 'nghêu', 'ốc', 'hải sản'],
      boost: { vitaminA: 20, vitaminC: 0, calcium: 60, iron: 1.0, fiber: 0 } },

    // Trứng → vitaminA vừa
    { keywords: ['trứng'],
      boost: { vitaminA: 80, vitaminC: 0, calcium: 25, iron: 0.9, fiber: 0 } },

    // Sữa, phô mai → calcium cao
    { keywords: ['sữa', 'phô mai', 'cheese', 'yogurt'],
      boost: { vitaminA: 50, vitaminC: 0, calcium: 120, iron: 0.1, fiber: 0 } },

    // Đậu → sắt, fiber
    { keywords: ['đậu', 'đỗ', 'hạt', 'lentil'],
      boost: { vitaminA: 0, vitaminC: 2, calcium: 30, iron: 1.5, fiber: 2.5 } },

    // Chanh, cam → vitaminC
    { keywords: ['chanh', 'cam', 'bưởi', 'táo', 'chuối', 'dứa', 'xoài'],
      boost: { vitaminA: 10, vitaminC: 25, calcium: 10, iron: 0.2, fiber: 1.5 } },

    // Cơm, bánh mì → ít vi chất
    { keywords: ['cơm trắng', 'gạo trắng', 'bánh mì trắng'],
      boost: { vitaminA: -10, vitaminC: -2, calcium: -5, iron: -0.3, fiber: -0.5 } },

    // Canh → thêm rau, tăng vi chất nhẹ
    { keywords: ['canh', 'soup', 'súp', 'lẩu'],
      boost: { vitaminA: 40, vitaminC: 8, calcium: 20, iron: 0.4, fiber: 0.5 } },

    // Xào, nướng → ít thay đổi
    { keywords: ['xào', 'nướng', 'chiên'],
      boost: { vitaminA: 0, vitaminC: -3, calcium: 0, iron: 0, fiber: 0 } },

    // Chay/rau củ chay → nhiều vi chất thực vật
    { keywords: ['chay', 'vegan', 'thuần chay'],
      boost: { vitaminA: 80, vitaminC: 15, calcium: 30, iron: 0.8, fiber: 2.0 } },

    // Đồ uống → ít vi chất
    { keywords: ['cà phê', 'trà', 'coffee', 'tea', 'nước'],
      boost: { vitaminA: -20, vitaminC: -5, calcium: -20, iron: -1.0, fiber: -1.0 } },

    // Nước ép, sinh tố → nhiều vitaminC
    { keywords: ['nước ép', 'sinh tố', 'smoothie', 'juice'],
      boost: { vitaminA: 30, vitaminC: 30, calcium: 10, iron: 0.2, fiber: 0.5 } },
];

function estimateMicronutrients(food) {
    const category = food.category || 'khac';
    const name = food.name.toLowerCase();

    // Base từ category
    const base = { ...CATEGORY_DEFAULTS[category] || CATEGORY_DEFAULTS.khac };

    // Áp dụng keyword boosts
    for (const { keywords, boost } of KEYWORD_BOOSTS) {
        if (keywords.some(k => name.includes(k))) {
            base.vitaminA = Math.max(0, (base.vitaminA || 0) + (boost.vitaminA || 0));
            base.vitaminC = Math.max(0, (base.vitaminC || 0) + (boost.vitaminC || 0));
            base.calcium  = Math.max(0, (base.calcium  || 0) + (boost.calcium  || 0));
            base.iron     = Math.max(0, (base.iron     || 0) + (boost.iron     || 0));
            base.fiber    = Math.max(0, (base.fiber    || 0) + (boost.fiber    || 0));
        }
    }

    // Làm tròn
    return {
        vitaminA: Math.round(base.vitaminA),
        vitaminC: Math.round(base.vitaminC * 10) / 10,
        calcium : Math.round(base.calcium),
        iron    : Math.round(base.iron * 10) / 10,
        fiber   : Math.round(base.fiber * 10) / 10,
    };
}

async function run() {
    try {
        // Chỉ cập nhật dish chưa có dữ liệu vi chất
        const dishes = await Food.findAll({
            where: { foodType: 'dish', vitaminA: null },
            order: [['name', 'ASC']],
        });

        console.log(`📋 Tìm thấy ${dishes.length} món ăn chưa có vi chất. Bắt đầu ước tính...`);

        let updated = 0;
        for (const dish of dishes) {
            const micro = estimateMicronutrients(dish);
            await dish.update(micro);
            updated++;
            if (updated % 30 === 0) {
                console.log(`  ✔ Đã cập nhật ${updated}/${dishes.length}...`);
            }
        }

        console.log(`\n✅ Hoàn thành! Đã ước tính vi chất cho ${updated} món ăn.`);
        console.log('   (Lưu ý: Đây là giá trị ước tính, không phải phân tích phòng thí nghiệm)');
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        process.exit();
    }
}

run();
