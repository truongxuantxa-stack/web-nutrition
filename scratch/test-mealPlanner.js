require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize } = require('../models');
const { pickIngredientsForTemplate, solveLinearSystem3x3, calculateWeights } = require('../services/mealPlanner.service');
const { MealTemplate } = require('../models');

async function runTests() {
    console.log('--- BẮT ĐẦU TEST ---');
    try {
        await sequelize.authenticate();
        console.log('1. DB Connected');

        // Test pickIngredientsForTemplate
        const template = await MealTemplate.findOne({ where: { name: 'Cơm truyền thống 🍚' }});
        if (!template) throw new Error('Không tìm thấy template');

        const foodsTraditional = await pickIngredientsForTemplate(template.toJSON());
        console.log('2. Picked Foods for Traditional:', foodsTraditional.map(f => `${f.name} (Tags: ${f.tags})`));

        // Kiểm tra xem có vi phạm tag không
        const isAllTraditional = foodsTraditional.every(f => !f.tags || f.tags.includes('traditional'));
        console.log('-> All Traditional Tags Valid:', isAllTraditional ? '✅ PASS' : '❌ FAIL');


        const templateHealthy = await MealTemplate.findOne({ where: { name: 'Bowl Healthy 🥗' }});
        const foodsHealthy = await pickIngredientsForTemplate(templateHealthy.toJSON());
        console.log('3. Picked Foods for Healthy:', foodsHealthy.map(f => `${f.name} (Tags: ${f.tags})`));

        const isAllHealthy = foodsHealthy.every(f => !f.tags || f.tags.includes('healthy_bowl'));
        console.log('-> All Healthy Tags Valid:', isAllHealthy ? '✅ PASS' : '❌ FAIL');

        // 4. Test Controller logic
        console.log('\n4. Test Controller Logic (Filter by tags)');
        const { getFoodsByRole } = require('../controllers/mealPlanner.controller');
        let resData = null;
        const mockReq = { query: { role: 'carb', tags: 'healthy_bowl' } };
        const mockRes = {
            status: () => mockRes,
            json: (data) => { resData = data; }
        };
        await getFoodsByRole(mockReq, mockRes);
        
        if (resData && resData.success && resData.data) {
            const allCarbHealthy = resData.data.every(f => !f.tags || f.tags.includes('healthy_bowl'));
            console.log(`-> API returned ${resData.data.length} carb items. All have healthy_bowl tag:`, allCarbHealthy ? '✅ PASS' : '❌ FAIL');
        } else {
            console.log('-> API Test: ❌ FAIL (No data returned)');
        }

    } catch (e) {
        console.error('Lỗi trong quá trình test:', e);
    } finally {
        await sequelize.close();
        console.log('--- KẾT THÚC TEST ---');
    }
}

runTests();
