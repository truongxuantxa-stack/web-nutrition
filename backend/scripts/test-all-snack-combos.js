require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, MealTemplate, Food } = require('../models');
const { generateMealPlan, allocateMealTargets } = require('../services/mealPlanner.service');
const { Op } = require('sequelize');

async function testAllCombos() {
    try {
        await sequelize.authenticate();
        
        const template = await MealTemplate.findOne({ where: { name: 'Bữa phụ Năng lượng 🍌' } });
        if (!template) {
            console.error('Template not found');
            return;
        }

        // Target macro typical for snack
        const target = { calories: 155, protein: 12, carbs: 16, fat: 5 };
        console.log('Target:', target);

        // Get all snack foods by role
        const getSnackFoods = async (role) => {
            const candidates = await Food.findAll({
                where: { category: role, foodType: 'raw' }
            });
            return candidates.filter(f => {
                const tags = f.tags || [];
                return tags.includes('snack');
            }).map(f => f.toJSON());
        };

        const carbs = await getSnackFoods('carb');
        const proteins = await getSnackFoods('protein');
        const fats = await getSnackFoods('fat');

        console.log(`Found: ${carbs.length} carbs, ${proteins.length} proteins, ${fats.length} fats`);

        let totalCombos = 0;
        let successCount = 0;
        let fallbackCount = 0;
        let fatalCount = 0;

        const { calculateWeights, validateSolution, solveHeuristicFallback } = require('../services/mealPlanner.service');

        for (const c of carbs) {
            for (const p of proteins) {
                for (const f of fats) {
                    totalCombos++;
                    const foods = [c, p, f];
                    const weights = calculateWeights(foods, target);
                    if (weights) {
                        const validation = validateSolution(weights);
                        if (validation.isValid) {
                            successCount++;
                        } else {
                            fallbackCount++;
                        }
                    } else {
                        fatalCount++;
                    }
                }
            }
        }

        console.log(`Total combos tested: ${totalCombos}`);
        console.log(`Direct Success: ${successCount} (${(successCount/totalCombos*100).toFixed(1)}%)`);
        console.log(`Needs Fallback: ${fallbackCount} (${(fallbackCount/totalCombos*100).toFixed(1)}%)`);
        console.log(`Matrix Singular / Fatal: ${fatalCount} (${(fatalCount/totalCombos*100).toFixed(1)}%)`);

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

testAllCombos();
