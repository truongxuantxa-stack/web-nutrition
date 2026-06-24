'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, MealTemplate } = require('../models');

const templates = [
    {
        name: 'Cơm truyền thống 🍚',
        description: 'Đĩa cơm Việt Nam quen thuộc: cơm trắng/gạo lứt, thịt/cá kho/luộc, rau xào/luộc, và dầu ăn truyền thống.',
        slots: [
            { role: 'carb',    allowedTags: ['traditional'] },
            { role: 'protein', allowedTags: ['traditional'] },
            { role: 'fiber',   allowedTags: ['traditional'] },
            { role: 'fat',     allowedTags: ['traditional'] },
        ],
        isActive: true,
    },
    {
        name: 'Bowl Healthy 🥗',
        description: 'Bát healthy kiểu Âu-Mỹ: yến mạch/quinoa, protein nạc, rau xanh superfood, và chất béo lành mạnh từ hạt/bơ.',
        slots: [
            { role: 'carb',    allowedTags: ['healthy_bowl'] },
            { role: 'protein', allowedTags: ['healthy_bowl'] },
            { role: 'fiber',   allowedTags: ['healthy_bowl'] },
            { role: 'fat',     allowedTags: ['healthy_bowl'] },
        ],
        isActive: true,
    },
    {
        name: 'Bữa phụ Năng lượng 🍌',
        description: 'Bữa ăn nhẹ nhanh gọn, giàu năng lượng từ trái cây, yến mạch, whey protein và các loại hạt tốt.',
        slots: [
            { role: 'carb',    allowedTags: ['snack'] },
            { role: 'protein', allowedTags: ['snack'] },
            { role: 'fat',     allowedTags: ['snack'] },
        ],
        isActive: true,
    },
];

async function seedMealTemplates() {
    try {
        await sequelize.authenticate();
        console.log('✅  Kết nối database thành công.');

        console.log('🔄  Đang đồng bộ cấu trúc bảng meal_templates...');
        await MealTemplate.sync({ alter: true });
        console.log('✅  Đồng bộ xong.');

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
        
        console.log('⚠️   Tiến hành xóa toàn bộ dữ liệu MealTemplates cũ...');
        await sequelize.queryInterface.bulkDelete('meal_templates', null, {});
        
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

        const now = new Date();
        const allTemplates = templates.map((t) => ({
            ...t,
            createdAt: now,
            updatedAt: now,
        }));

        const inserted = await MealTemplate.bulkCreate(allTemplates, { validate: true });
        console.log(`🎉  Seed thành công: ${inserted.length} khuôn mẫu đã được thêm vào bảng meal_templates.`);

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

// Chỉ chạy khi file được gọi TRỰC TIẾP (node seeders/mealTemplates.js)
// Tránh tự động thực thi khi bị require() bởi file khác → Ngăn xóa DB nhầm!
if (require.main === module) {
    seedMealTemplates();
}
