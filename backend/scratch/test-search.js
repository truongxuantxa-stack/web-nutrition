require('dotenv').config();
const { searchFood } = require('../services/diary.service');
const { sequelize } = require('../models');

async function test() {
    try {
        console.log('Testing Local Search (q=Phở)...');
        let res = await searchFood(1, { q: 'Phở' });
        console.log(`Found ${res.foods.length} items.`);
        if (res.foods.length > 0) {
            console.log(res.foods[0].name, '-', res.foods[0].dataSource);
        }

        console.log('\nTesting Hybrid Search (q=Coca Cola)...');
        res = await searchFood(1, { q: 'Coca Cola', limit: 10 });
        console.log(`Found ${res.foods.length} items.`);
        if (res.foods.length > 0) {
            console.log(res.foods.slice(-1)[0].name, '-', res.foods.slice(-1)[0].dataSource);
        }

        console.log('\nTesting Cached Search (q=Coca Cola)...');
        res = await searchFood(1, { q: 'Coca Cola', limit: 10 });
        console.log(`Found ${res.foods.length} items.`);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
test();
