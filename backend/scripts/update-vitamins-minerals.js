'use strict';
/**
 * Cập nhật giá trị vitaminA, vitaminC, calcium, iron cho từng món ăn theo tên.
 * Chạy: node scripts/update-vitamins-minerals.js
 *
 * vitaminA (µg RAE)
 * vitaminC (mg)
 * calcium (mg)
 * iron (mg)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Food } = require('../models');

// [tên, vitaminA, vitaminC, calcium, iron]
const updates = [
    // ── PROTEIN RAW ─────────────────────────────────────
    ['Ức gà (Thô)',              5,    0,   15,   1],
    ['Thịt bò thăn (Thô)',       0,    0,   18,   2.6],
    ['Cá hồi tươi (Thô)',        12,   0,   9,    0.3],
    ['Cá rô phi (Thô)',          0,    0,   10,   0.6],
    ['Tôm tươi (Thô)',           0,    0,   52,   0.5],
    ['Lòng trắng trứng (Thô)',   0,    0,   7,    0.1],
    ['Đậu phụ (Thô)',            0,    0,   350,  5.4],
    ['Sữa chua Hy Lạp (Thô)',    14,   0,   110,  0.1],
    ['Thịt đùi gà (Bỏ da)',      15,   0,   11,   1.3],
    ['Thịt lợn thăn (Nạc)',      2,    0,   19,   1.2],
    ['Bắp bò (Nạc)',             0,    0,   21,   3],
    ['Cá ngừ đại dương',         655,  0,   17,   1.5],
    ['Lòng đỏ trứng (Thô)',      381,  0,   129,  2.7],
    ['Đậu nành (Hạt khô)',       1,    6,   277,  15.7],
    ['Đậu Hà Lan',               38,   40,  25,   1.5],
    ['Phô mai tươi (Cottage Cheese)', 37, 0, 83, 0.1],
    ['Cá basa',                  0,    0,   10,   0.5],
    ['Trứng cút (Thô)',          156,  0,   64,   3.7],
    ['Thịt vịt (Nạc)',           14,   0,   11,   2.4],
    ['Cá thu (Thô)',             47,   0,   15,   1.6],
    ['Sữa tươi không đường',     46,   0,   113,  0],
    ['Trứng gà (Thô)',           160,  0,   50,   1.2],

    // ── CARB RAW ─────────────────────────────────────
    ['Cơm trắng (Thô/Chín)',     0,    0,   10,   0.2],
    ['Yến mạch khô (Thô)',       0,    0,   54,   4.7],
    ['Gạo lứt (Thô)',            0,    0,   10,   1.4],
    ['Khoai lang (Thô)',         709,  2.4, 30,   0.6],
    ['Hạt Quinoa (Thô)',         1,    0,   47,   4.6],
    ['Ngô ngọt (Bắp)',           9,    6.8, 2,    0.5],
    ['Bí đỏ (Bí ngô)',           426,  9,   21,   0.8],
    ['Đậu đỏ (Hạt khô)',         0,    4.5, 28,   5],
    ['Đậu xanh (Hạt khô)',       6,    4.8, 132,  6.7],
    ['Khoai tây (Thô)',          0,    19.7, 12,  0.8],

    // ── FIBER RAW ─────────────────────────────────────
    ['Bông cải xanh (Thô)',      31,   89.2, 47,  0.7],
    ['Măng tây',                 38,   5.6, 24,   2.1],
    ['Rau cải chíp',             223,  45,  105,  0.8],
    ['Rau muống',                315,  55,  77,   1.7],
    ['Dưa chuột',                5,    2.8, 16,   0.3],
    ['Cà chua',                  42,   13.7, 10,  0.3],
    ['Rau ngót',                 600,  130, 169,  2.7],
    ['Rau dền',                  146,  43,  215,  2.3],
    ['Mướp đắng (Khổ qua)',      11,   84,  19,   0.4],
    ['Cà rốt',                   835,  5.9, 33,   0.3],
    ['Rau xà lách',              370,  9.2, 36,   0.9],
    ['Cải xoăn (Kale)',          241,  120, 254,  1.5],
    ['Ớt chuông',                157,  127.7, 7,  0.4],
    ['Rau chân vịt (Spinach)',   469,  28.1, 99,  2.7],

    // ── VITAMIN RAW ─────────────────────────────────────
    ['Chuối (Thô)',              3,    8.7, 5,    0.3],
    ['Táo đỏ',                   3,    4.6, 6,    0.1],
    ['Quả Việt quất',            3,    9.7, 6,    0.3],
    ['Quả Dâu tây',              1,    58.8, 16,  0.4],
    ['Đu đủ (Chín)',             47,   60.9, 20,  0.3],
    ['Xoài (Chín)',              54,   36.4, 11,  0.2],
    ['Dưa hấu',                  28,   8.1, 7,    0.2],
    ['Bưởi',                     58,   31.2, 22,  0.1],
    ['Ổi',                       31,   228.3, 18, 0.3],
    ['Nho tươi',                 3,    3.2, 10,   0.4],
    ['Cam (Thô)',                11,   53.2, 40,  0.1],
    ['Kiwi',                     4,    92.7, 34,  0.3],

    // ── FAT RAW ─────────────────────────────────────
    ['Quả Bơ (Thô)',             7,    10,  12,   0.5],
    ['Hạt Hạnh nhân (Thô)',      0,    0,   269,  3.7],
    ['Hạt Chia (Thô)',           0,    1.6, 631,  7.7],
    ['Hạt Óc chó',               1,    1.3, 98,   2.9],
    ['Bơ đậu phộng (Nguyên chất)', 0, 0, 43, 1.9],
    ['Đậu phộng (Lạc thô)',      0,    0,   92,   4.6],
    ['Hạt Lanh (Flaxseed)',      0,    0.6, 255,  5.7],
];

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅  Kết nối database thành công.');

        let updated = 0;
        let notFound = 0;

        for (const [name, vitaminA, vitaminC, calcium, iron] of updates) {
            const food = await Food.findOne({ where: { name } });
            if (!food) {
                console.log(`   ⚠️  Không tìm thấy: "${name}"`);
                notFound++;
                continue;
            }
            await food.update({ vitaminA, vitaminC, calcium, iron });
            updated++;
        }

        console.log(`\n🎉  Hoàn tất! Đã cập nhật ${updated} món, không tìm thấy ${notFound} món.`);
    } catch (err) {
        console.error('❌  Lỗi:', err.message);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('🔒  Đã đóng kết nối.');
    }
}

run();
