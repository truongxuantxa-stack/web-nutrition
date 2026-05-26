require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, MealTemplate, User } = require('../models');
const { generateMealPlan, allocateMealTargets } = require('../services/mealPlanner.service');
const nutritionService = require('../services/nutrition.service');

async function testSnack() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // Lấy template Bữa phụ Năng lượng
        const template = await MealTemplate.findOne({ where: { name: 'Bữa phụ Năng lượng 🍌' } });
        if (!template) {
            console.error('❌ Không tìm thấy template Bữa phụ Năng lượng');
            return;
        }
        console.log('📋 Template:', template.toJSON());

        // Tìm một user
        const user = await User.findOne();
        if (!user) {
            console.error('❌ Không tìm thấy user nào để test');
            return;
        }
        console.log('👤 User:', user.name, 'Weight:', user.weight, 'Height:', user.height);

        const metrics = nutritionService.calculateAllMetrics(user);
        console.log('📊 Metrics target calories:', metrics.targetCalories, 'Macros:', metrics.macros);

        const mealsConfig = [
            { key: 'sang', percent: 25 },
            { key: 'trua', percent: 35 },
            { key: 'toi', percent: 30 },
            { key: 'phu', percent: 10 }
        ];

        const allTargets = allocateMealTargets(metrics.targetCalories, metrics.macros, mealsConfig);
        const target = allTargets.phu;
        console.log('🎯 Snack target:', target);

        // Chạy sinh thực đơn 5 lần
        for (let i = 1; i <= 5; i++) {
            console.log(`\n--- Lần ${i} ---`);
            const result = await generateMealPlan(template.toJSON(), target);
            if (result.success) {
                console.log('✅ Thành công:');
                result.data.forEach(item => {
                    console.log(`   - ${item.food.name}: ${item.grams}g (Category: ${item.food.category})`);
                });
                if (result.warnings && result.warnings.length > 0) {
                    console.log('   ⚠️ Warnings:', result.warnings);
                }
            } else {
                console.log('❌ Thất bại:', result.errors);
            }
        }
    } catch (e) {
        console.error('❌ Lỗi:', e);
    } finally {
        await sequelize.close();
    }
}

testSnack();
