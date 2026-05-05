'use strict';

/**
 * Seeder: ~50 món ăn phổ biến Việt Nam
 * Dữ liệu dinh dưỡng tính trên 1 đơn vị (unit).
 * Nguồn tham khảo: Bảng thành phần dinh dưỡng Việt Nam (Viện Dinh Dưỡng).
 *
 * Chạy: node seeders/foods.js
 */

require('dotenv').config();
const { sequelize, Food } = require('../models');

const foodData = [
    // ── CƠM & XÔI ─────────────────────────────────────────────────────────────
    {
        name: 'Cơm trắng',
        calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3,
        unit: '1 bát (150g)', category: 'com',
        description: 'Cơm trắng nấu chín, bát vừa',
    },
    {
        name: 'Cơm rang trứng',
        calories: 280, protein: 9.0, carbs: 38.0, fat: 10.0,
        unit: '1 đĩa (200g)', category: 'com',
        description: 'Cơm chiên với trứng và hành lá',
    },
    {
        name: 'Cơm tấm sườn',
        calories: 520, protein: 28.0, carbs: 52.0, fat: 22.0,
        unit: '1 phần', category: 'com',
        description: 'Cơm tấm với sườn nướng, bì, chả',
    },
    {
        name: 'Xôi xéo',
        calories: 350, protein: 8.0, carbs: 58.0, fat: 9.0,
        unit: '1 gói (200g)', category: 'com',
        description: 'Xôi đỗ xanh với hành phi',
    },
    {
        name: 'Xôi gà',
        calories: 420, protein: 22.0, carbs: 55.0, fat: 12.0,
        unit: '1 phần (250g)', category: 'com',
        description: 'Xôi nếp với gà xé phay',
    },
    {
        name: 'Cơm chiên dương châu',
        calories: 310, protein: 10.0, carbs: 42.0, fat: 11.0,
        unit: '1 đĩa (200g)', category: 'com',
        description: 'Cơm chiên với tôm, lạp xưởng, rau củ',
    },

    // ── PHỞ, BÚN, MÌ ─────────────────────────────────────────────────────────
    {
        name: 'Phở bò',
        calories: 350, protein: 22.0, carbs: 45.0, fat: 8.0,
        unit: '1 tô (500ml)', category: 'pho_bun',
        description: 'Phở bò truyền thống với bánh phở',
    },
    {
        name: 'Phở gà',
        calories: 300, protein: 20.0, carbs: 42.0, fat: 5.0,
        unit: '1 tô (500ml)', category: 'pho_bun',
        description: 'Phở với thịt gà luộc xé sợi',
    },
    {
        name: 'Bún bò Huế',
        calories: 400, protein: 25.0, carbs: 50.0, fat: 10.0,
        unit: '1 tô (500ml)', category: 'pho_bun',
        description: 'Bún bò cay đặc trưng miền Trung',
    },
    {
        name: 'Bún chả',
        calories: 380, protein: 24.0, carbs: 40.0, fat: 14.0,
        unit: '1 phần', category: 'pho_bun',
        description: 'Bún với chả nướng và nước mắm',
    },
    {
        name: 'Bún riêu cua',
        calories: 320, protein: 18.0, carbs: 44.0, fat: 7.0,
        unit: '1 tô (500ml)', category: 'pho_bun',
        description: 'Bún với riêu cua, cà chua',
    },
    {
        name: 'Mì xào bò',
        calories: 450, protein: 22.0, carbs: 52.0, fat: 16.0,
        unit: '1 đĩa (300g)', category: 'pho_bun',
        description: 'Mì trứng xào với thịt bò và rau củ',
    },
    {
        name: 'Hủ tiếu Nam Vang',
        calories: 370, protein: 20.0, carbs: 46.0, fat: 9.0,
        unit: '1 tô', category: 'pho_bun',
        description: 'Hủ tiếu với thịt heo, tôm, gan',
    },
    {
        name: 'Mì gói (ăn nước)',
        calories: 320, protein: 8.0, carbs: 48.0, fat: 11.0,
        unit: '1 gói + trứng', category: 'pho_bun',
        description: 'Mì ăn liền nấu với trứng',
    },
    {
        name: 'Bánh canh cua',
        calories: 360, protein: 16.0, carbs: 50.0, fat: 9.0,
        unit: '1 tô', category: 'pho_bun',
        description: 'Bánh canh bột lọc với cua biển',
    },

    // ── BÁNH ─────────────────────────────────────────────────────────────────
    {
        name: 'Bánh mì thịt',
        calories: 380, protein: 18.0, carbs: 44.0, fat: 14.0,
        unit: '1 ổ', category: 'banh',
        description: 'Bánh mì với pate, thịt, dưa cải',
    },
    {
        name: 'Bánh mì trứng',
        calories: 300, protein: 10.0, carbs: 40.0, fat: 12.0,
        unit: '1 ổ', category: 'banh',
        description: 'Bánh mì với trứng ốp la',
    },
    {
        name: 'Bánh cuốn',
        calories: 220, protein: 12.0, carbs: 30.0, fat: 6.0,
        unit: '1 phần (5 cuốn)', category: 'banh',
        description: 'Bánh cuốn nhân thịt heo, mộc nhĩ',
    },
    {
        name: 'Bánh xèo',
        calories: 280, protein: 14.0, carbs: 26.0, fat: 12.0,
        unit: '1 cái', category: 'banh',
        description: 'Bánh xèo giòn với tôm, thịt, giá',
    },
    {
        name: 'Bánh bao nhân thịt',
        calories: 240, protein: 10.0, carbs: 32.0, fat: 8.0,
        unit: '1 cái (100g)', category: 'banh',
        description: 'Bánh bao hấp nhân thịt heo trứng cút',
    },
    {
        name: 'Bánh chưng',
        calories: 290, protein: 7.0, carbs: 50.0, fat: 7.0,
        unit: '1 miếng (150g)', category: 'banh',
        description: 'Bánh chưng lá dong truyền thống',
    },

    // ── THỊT & CÁ ────────────────────────────────────────────────────────────
    {
        name: 'Thịt heo luộc',
        calories: 215, protein: 22.0, carbs: 0.0, fat: 14.0,
        unit: '100g', category: 'thit_ca',
        description: 'Thịt ba chỉ luộc chín',
    },
    {
        name: 'Thịt gà luộc',
        calories: 165, protein: 25.0, carbs: 0.0, fat: 6.5,
        unit: '100g', category: 'thit_ca',
        description: 'Ức gà luộc, bỏ da',
    },
    {
        name: 'Cá basa chiên',
        calories: 200, protein: 20.0, carbs: 3.0, fat: 12.0,
        unit: '100g', category: 'thit_ca',
        description: 'Cá basa phi lê chiên giòn',
    },
    {
        name: 'Tôm hấp',
        calories: 99, protein: 21.0, carbs: 0.0, fat: 1.1,
        unit: '100g', category: 'thit_ca',
        description: 'Tôm tươi hấp sả',
    },
    {
        name: 'Trứng gà luộc',
        calories: 155, protein: 13.0, carbs: 1.1, fat: 11.0,
        unit: '2 quả', category: 'thit_ca',
        description: 'Trứng gà luộc chín',
    },
    {
        name: 'Thịt bò xào',
        calories: 250, protein: 26.0, carbs: 5.0, fat: 14.0,
        unit: '100g', category: 'thit_ca',
        description: 'Thịt bò thăn xào hành tây',
    },
    {
        name: 'Cá hồi áp chảo',
        calories: 208, protein: 22.0, carbs: 0.0, fat: 13.0,
        unit: '100g', category: 'thit_ca',
        description: 'Cá hồi áp chảo với dầu ô liu',
    },
    {
        name: 'Đậu phụ chiên',
        calories: 145, protein: 9.0, carbs: 4.0, fat: 11.0,
        unit: '100g', category: 'thit_ca',
        description: 'Đậu phụ chiên vàng giòn',
    },

    // ── RAU CỦ ────────────────────────────────────────────────────────────────
    {
        name: 'Rau muống xào tỏi',
        calories: 65, protein: 3.0, carbs: 8.0, fat: 3.0,
        unit: '1 đĩa (150g)', category: 'rau_cu',
        description: 'Rau muống xào với tỏi',
    },
    {
        name: 'Canh chua cá',
        calories: 120, protein: 12.0, carbs: 10.0, fat: 3.0,
        unit: '1 bát (300ml)', category: 'rau_cu',
        description: 'Canh chua với cá lóc, cà chua, thơm',
    },
    {
        name: 'Salad rau trộn',
        calories: 80, protein: 2.0, carbs: 10.0, fat: 4.0,
        unit: '1 đĩa (200g)', category: 'rau_cu',
        description: 'Salad xà lách, cà chua, dưa leo',
    },
    {
        name: 'Súp lơ xào',
        calories: 55, protein: 3.5, carbs: 7.0, fat: 2.0,
        unit: '1 đĩa (150g)', category: 'rau_cu',
        description: 'Súp lơ trắng/xanh xào tỏi',
    },
    {
        name: 'Canh bầu tôm',
        calories: 90, protein: 9.0, carbs: 8.0, fat: 1.5,
        unit: '1 bát (300ml)', category: 'rau_cu',
        description: 'Canh bầu nấu với tôm khô',
    },
    {
        name: 'Khoai lang hấp',
        calories: 86, protein: 1.6, carbs: 20.0, fat: 0.1,
        unit: '100g', category: 'rau_cu',
        description: 'Khoai lang vàng hấp chín',
    },

    // ── TRÁI CÂY ─────────────────────────────────────────────────────────────
    {
        name: 'Chuối tiêu',
        calories: 89, protein: 1.1, carbs: 23.0, fat: 0.3,
        unit: '1 quả (120g)', category: 'trai_cay',
        description: 'Chuối tiêu chín vàng',
    },
    {
        name: 'Cam tươi',
        calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2,
        unit: '1 quả (180g)', category: 'trai_cay',
        description: 'Cam sành không hạt',
    },
    {
        name: 'Xoài chín',
        calories: 60, protein: 0.8, carbs: 15.0, fat: 0.4,
        unit: '100g', category: 'trai_cay',
        description: 'Xoài cát chín vàng',
    },
    {
        name: 'Dưa hấu',
        calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2,
        unit: '100g', category: 'trai_cay',
        description: 'Dưa hấu đỏ mát',
    },
    {
        name: 'Táo đỏ',
        calories: 52, protein: 0.3, carbs: 14.0, fat: 0.2,
        unit: '1 quả (180g)', category: 'trai_cay',
        description: 'Táo fuji hoặc gala',
    },
    {
        name: 'Ổi',
        calories: 68, protein: 2.6, carbs: 14.0, fat: 1.0,
        unit: '100g', category: 'trai_cay',
        description: 'Ổi lê Đài Loan giòn ngọt',
    },

    // ── ĐỒ UỐNG ──────────────────────────────────────────────────────────────
    {
        name: 'Sữa tươi không đường',
        calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3,
        unit: '1 hộp (200ml)', category: 'do_uong',
        description: 'Sữa tươi thanh trùng không đường',
    },
    {
        name: 'Sinh tố chuối',
        calories: 180, protein: 3.5, carbs: 35.0, fat: 3.0,
        unit: '1 ly (300ml)', category: 'do_uong',
        description: 'Sinh tố chuối với sữa',
    },
    {
        name: 'Cà phê sữa đá',
        calories: 120, protein: 2.0, carbs: 18.0, fat: 4.5,
        unit: '1 ly (300ml)', category: 'do_uong',
        description: 'Cà phê phin pha sữa đặc có đường',
    },
    {
        name: 'Trà sữa trân châu',
        calories: 280, protein: 2.5, carbs: 55.0, fat: 4.0,
        unit: '1 ly (500ml)', category: 'do_uong',
        description: 'Trà sữa với trân châu đường đen',
    },
    {
        name: 'Nước dừa tươi',
        calories: 46, protein: 0.6, carbs: 10.0, fat: 0.5,
        unit: '1 trái (300ml)', category: 'do_uong',
        description: 'Nước dừa xiêm nguyên chất',
    },
    {
        name: 'Sữa chua (yogurt)',
        calories: 100, protein: 5.0, carbs: 14.0, fat: 2.5,
        unit: '1 hũ (100g)', category: 'do_uong',
        description: 'Sữa chua Vinamilk nguyên kem',
    },
    {
        name: 'Nước ép cam tươi',
        calories: 55, protein: 0.9, carbs: 13.0, fat: 0.1,
        unit: '1 ly (250ml)', category: 'do_uong',
        description: 'Nước cam vắt tươi không đường',
    },

    // ── KHÁC ─────────────────────────────────────────────────────────────────
    {
        name: 'Phở cuốn',
        calories: 160, protein: 10.0, carbs: 22.0, fat: 4.0,
        unit: '1 cuốn (120g)', category: 'khac',
        description: 'Phở cuốn thịt bò, rau thơm',
    },
    {
        name: 'Chả giò (nem rán)',
        calories: 180, protein: 7.0, carbs: 16.0, fat: 10.0,
        unit: '2 cái (100g)', category: 'khac',
        description: 'Nem rán vàng giòn nhân thịt heo',
    },
    {
        name: 'Đậu phộng rang',
        calories: 567, protein: 26.0, carbs: 16.0, fat: 49.0,
        unit: '100g', category: 'khac',
        description: 'Đậu phộng rang muối khô',
    },
    {
        name: 'Bánh flan',
        calories: 120, protein: 4.0, carbs: 18.0, fat: 4.0,
        unit: '1 cái (80g)', category: 'khac',
        description: 'Bánh flan caramen mềm mịn',
    },
];

async function seedFoods() {
    try {
        await sequelize.authenticate();
        console.log('✅  Kết nối database thành công.');

        // Sync chỉ bảng foods (không force để tránh mất dữ liệu)
        await Food.sync({ alter: true });
        console.log('✅  Bảng foods đã sẵn sàng.');

        // Xóa data cũ (chỉ khi chạy seed lại)
        const existingCount = await Food.count();
        if (existingCount > 0) {
            console.log(`⚠️   Bảng foods đã có ${existingCount} bản ghi. Xóa và seed lại...`);
            await Food.destroy({ where: {}, truncate: true });
        }

        // Thêm timestamp tự động
        const now = new Date();
        const dataWithTimestamps = foodData.map((f) => ({
            ...f,
            createdAt: now,
            updatedAt: now,
        }));

        const inserted = await Food.bulkCreate(dataWithTimestamps, { validate: true });
        console.log(`🎉  Seed thành công: ${inserted.length} món ăn đã được thêm vào bảng foods.`);

        // In tóm tắt theo category
        const summary = {};
        foodData.forEach((f) => {
            summary[f.category] = (summary[f.category] || 0) + 1;
        });
        console.log('\n📊  Tóm tắt theo danh mục:');
        Object.entries(summary).forEach(([cat, count]) => {
            console.log(`     ${cat.padEnd(15)}: ${count} món`);
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
