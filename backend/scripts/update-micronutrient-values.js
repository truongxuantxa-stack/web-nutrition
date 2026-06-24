'use strict';
/**
 * Cập nhật giá trị fiber, sugar, sodium cho từng món ăn theo tên.
 * Chạy: node scripts/update-micronutrient-values.js
 *
 * fiber  (g)  — chất xơ / 100g hoặc /phần
 * sugar  (g)  — đường tổng / 100g hoặc /phần
 * sodium (mg) — natri / 100g hoặc /phần
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Food } = require('../models');

// [tên, fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron]
const updates = [
    // ── PROTEIN RAW ─────────────────────────────────────
    ['Ức gà (Thô)',              0,    0,   74],
    ['Thịt bò thăn (Thô)',       0,    0,   72],
    ['Cá hồi tươi (Thô)',        0,    0,   59],
    ['Cá rô phi (Thô)',          0,    0,   56],
    ['Tôm tươi (Thô)',           0,    0,  111],
    ['Lòng trắng trứng (Thô)',   0,    0,  166],
    ['Đậu phụ (Thô)',            0.3,  0.5, 9],
    ['Sữa chua Hy Lạp (Thô)',    0,    3.2, 36],
    ['Thịt đùi gà (Bỏ da)',      0,    0,   90],
    ['Thịt lợn thăn (Nạc)',      0,    0,   53],
    ['Bắp bò (Nạc)',             0,    0,   55],
    ['Cá ngừ đại dương',         0,    0,   50],
    ['Mực ống tươi',             0,    0,  230],
    ['Bạch tuộc',                0,    0,  230],
    ['Lòng đỏ trứng (Thô)',      0,    0.1, 14],
    ['Đậu nành (Hạt khô)',       9.3,  7.3, 2],
    ['Đậu Hà Lan',               5.1,  5.7, 5],
    ['Phô mai tươi (Cottage Cheese)', 0, 2.7, 364],
    ['Hàu tươi',                 0,    0,   211],
    ['Cua biển',                 0,    0,   293],
    ['Cá basa',                  0,    0,   50],
    ['Tempeh (Tương nén)',        9,    0,   9],
    ['Lươn (Thô)',               0,    0,   60],
    ['Ếch (Thô)',                0,    0,   58],
    ['Sò huyết',                 0,    0,   200],
    ['Ngao (Nghêu)',             0,    0,   200],
    ['Cá lóc (Thô)',             0,    0,   60],
    ['Cá diêu hồng (Thô)',       0,    0,   50],
    ['Hến',                      0,    0,   150],
    ['Đậu hũ non (Thô)',         0.3,  0.3, 10],
    ['Trứng cút (Thô)',          0,    0.4, 141],
    ['Thịt vịt (Nạc)',           0,    0,   74],
    ['Cá thu (Thô)',             0,    0,   83],
    ['Cá chép (Thô)',            0,    0,   56],
    ['Thịt thỏ (Thô)',           0,    0,   47],
    ['Tôm sú (Thô)',             0,    0,  170],
    ['Cá trích (Thô)',           0,    0,   90],
    ['Sữa tươi không đường',     0,    5,   44],
    ['Trứng gà (Thô)',           0,    0.6, 124],

    // ── CARB RAW ─────────────────────────────────────
    ['Cơm trắng (Thô/Chín)',     0.4,  0,    1],
    ['Yến mạch khô (Thô)',      10.6,  0.9,  2],
    ['Gạo lứt (Thô)',            3.5,  0.9,  7],
    ['Khoai lang (Thô)',         3,    4.2,  55],
    ['Hạt Quinoa (Thô)',         7,    1.6,  5],
    ['Ngô ngọt (Bắp)',           2,    3.2,  15],
    ['Bí đỏ (Bí ngô)',           0.5,  2.8,  1],
    ['Đậu đỏ (Hạt khô)',        15.2,  2.1,  24],
    ['Đậu xanh (Hạt khô)',       7.6,  9,    15],
    ['Sắn (Khoai mì)',           1.8,  1.7,  14],
    ['Khoai tây (Thô)',          2.2,  0.8,  6],
    ['Khoai môn (Thô)',          4.1,  0.4,  11],
    ['Bún khô (Thô)',            0.3,  0,    5],
    ['Mì sợi khô (Thô)',         3.2,  2.7,  6],
    ['Bánh tráng (Thô)',         0.9,  0.3,  400],

    // ── FIBER RAW ─────────────────────────────────────
    ['Bông cải xanh (Thô)',      2.6,  1.7,  33],
    ['Măng tây',                 2.1,  1.9,  2],
    ['Rau cải chíp',             1,    1.2,  65],
    ['Rau muống',                2.1,  0.5,  113],
    ['Nấm kim châm',             2.7,  1.5,  2],
    ['Nấm đùi gà',               1.7,  1.1,  9],
    ['Củ cải trắng',             1.6,  2,    39],
    ['Dưa chuột',                0.5,  1.7,  2],
    ['Cà chua',                  1.2,  2.6,  5],
    ['Rau ngót',                 2.5,  0.4,  33],
    ['Rau dền',                  2.2,  0,    23],
    ['Rau mồng tơi',             0.5,  0,    24],
    ['Cải bẹ xanh',              1.8,  1.3,  27],
    ['Cải thảo',                 1,    1.2,  9],
    ['Mướp đắng (Khổ qua)',      2.8,  1.9,  5],
    ['Bầu',                      0.5,  2,    3],
    ['Bí xanh (Bí đao)',         0.5,  2.3,  8],
    ['Giá đỗ',                   1.8,  2,    6],
    ['Su hào',                   3.6,  2.5,  20],
    ['Củ dền',                   2.8,  6.8,  78],
    ['Cà rốt',                   2.8,  4.7,  69],
    ['Rau xà lách',              1.3,  0.8,  28],
    ['Cải xoăn (Kale)',          3.6,  0,    53],
    ['Ớt chuông',                2.1,  4.2,  4],
    ['Rau chân vịt (Spinach)',   2.2,  0.4,  79],
    ['Nấm hương khô',           28.2,  2.5,  19],

    // ── VITAMIN RAW ─────────────────────────────────────
    ['Chuối (Thô)',              2.6, 12.2,   1],
    ['Táo đỏ',                   2.4, 10.4,   1],
    ['Quả Việt quất',            2.4,  9.9,   1],
    ['Quả Dâu tây',              2,    4.9,   1],
    ['Đu đủ (Chín)',             1.7,  7.8,   8],
    ['Xoài (Chín)',              1.6, 13.7,   1],
    ['Dưa hấu',                  0.4,  6.2,   1],
    ['Thanh long',               1.9,  9.9,   39],
    ['Bưởi',                     1.6,  7,     0],
    ['Ổi',                       5.4,  8.9,   2],
    ['Nho tươi',                 0.9, 15.5,   2],
    ['Cam (Thô)',                2.4,  9.4,   0],
    ['Quýt (Thô)',               1.8,  10.6,  2],
    ['Kiwi',                     3,    9,     3],
    ['Lê',                       3.1,  9.8,   1],
    ['Mận (Thô)',                1.4,  9.9,   0],
    ['Dứa (Thơm)',               1.4,  9.9,   1],
    ['Măng cụt',                 1.8, 16.5,   7],
    ['Chôm chôm',                0.9, 15.7,   11],

    // ── FAT RAW ─────────────────────────────────────
    ['Quả Bơ (Thô)',             6.7,  0.7,   7],
    ['Hạt Hạnh nhân (Thô)',     12.5,  4.4,   1],
    ['Hạt Chia (Thô)',          34.4,  0,     16],
    ['Dầu Olive (Thô)',          0,    0,     0],
    ['Hạt Óc chó',               6.7,  2.6,   2],
    ['Hạt Điều',                 3.3,  5.9,  12],
    ['Hạt Bí',                   6,    1.4,   7],
    ['Bơ đậu phộng (Nguyên chất)', 6,  9.2, 369],
    ['Dầu Dừa',                  0,    0,     0],
    ['Vừng (Mè)',               11.8,  0.3,  11],
    ['Đậu phộng (Lạc thô)',      8.5,  4,     18],
    ['Mỡ heo (Thô)',             0,    0,     0],
    ['Hạt Macca',                8.6,  4.6,   5],
    ['Quả Ô liu',                3.2,  0,   1556],
    ['Hạt Hướng dương',         11.1,  2.6,   9],
    ['Hạt Lanh (Flaxseed)',     27.3,  1.6,   30],

    // ── MÓN ĂN CHỌN LỌC (DISHES) ─────────────────────
    ['Salad Ức gà áp chảo',      4,    3,   480],
    ['Cơm gạo lứt thịt bò',      3,    2,   520],
    ['Phở Gà',                   1,    2,   850],
    ['Bún Bò Huế',               1.5,  3,  1200],
    ['Cơm Tấm Sườn',             1,    5,   800],
    ['Canh Chua Cá Lóc',         2,    4,   650],
    ['Tôm Hấp Sả',               0,    0,   280],
    ['Bông Cải Xanh Luộc',       2.6,  1.7,  35],
    ['Gà Luộc Lá Chanh',         0,    0,   250],
    ['Cháo Gà Gạo Lứt',          1.5,  1,   680],
    ['Yến Mạch Trái Cây Hạt',    5,    8,   120],
    ['Salad Bơ Tôm',             4,    2,   450],
    ['Soup Rau Củ Detox',        3,    4,   380],
    ['Rau Muống Xào Tỏi',        2,    0.5, 420],
    ['Cải Bó Xôi Xào Tỏi',      2,    0.4, 350],

    // ── ĐỒ UỐNG ─────────────────────────────────────
    ['Nước Ép Cam Tươi',         0.2,  8.4,   1,    10,  40, 11, 0.2],
    ['Cam (Thô)',                2.4,  9.4,   0,    11,  53, 40, 0.1],
    ['Nước Ép Dưa Hấu',          0.2,  6.2,   1],
    ['Sinh Tố Bơ',               5,    6,     15],
    ['Sinh Tố Chuối Sữa',        1.5, 20,     45],
    ['Trà Xanh Không Đường',     0,    0,      5],
    ['Trà Sữa Trân Châu',        0.5, 40,    120],
    ['Nước Dừa Tươi',            1,    6.3,   105],
    ['Cà Phê Đen Không Đường',   0,    0,      5],
    ['Cà Phê Sữa Đá',            0,   14,     55],
    ['Sữa Đậu Nành',             0.3,  4.5,   32],
    ['Sữa Tươi Có Đường',        0,    7.5,   50],
    ['Nước Mía',                 0,   18,     15],
];

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅  Kết nối database thành công.');

        let updated = 0;
        let notFound = 0;

        for (const [name, fiber, sugar, sodium, vitaminA = null, vitaminC = null, calcium = null, iron = null] of updates) {
            const food = await Food.findOne({ where: { name } });
            if (!food) {
                console.log(`   ⚠️  Không tìm thấy: "${name}"`);
                notFound++;
                continue;
            }
            await food.update({ fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron });
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
