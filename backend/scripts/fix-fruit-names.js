'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Food, sequelize } = require('../models');

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        // 1. Rename RAW foods to have (Thô) suffix
        const rawToRename = [
            'Táo đỏ', 'Dưa hấu', 'Thanh long', 'Bưởi', 'Ổi', 
            'Kiwi', 'Lê', 'Măng cụt', 'Chôm chôm', 'Nho tươi'
        ];

        for (const name of rawToRename) {
            const food = await Food.findOne({ where: { name, foodType: 'raw' } });
            if (food) {
                await food.update({ name: `${name} (Thô)` });
                console.log(`Renamed raw food: ${name} -> ${name} (Thô)`);
            }
        }

        // 2. Remove (1 quả), (1 miếng), (1 lát), (1 múi) from all serving foods
        const suffixes = ['(1 quả)', '(1 miếng)', '(1 lát)', '(1 múi)'];
        const servingFoods = await Food.findAll({ where: { foodType: 'dish' } });

        for (const food of servingFoods) {
            let newName = food.name;
            for (const suffix of suffixes) {
                if (newName.includes(suffix)) {
                    newName = newName.replace(suffix, '').trim();
                }
            }
            if (newName !== food.name) {
                await food.update({ name: newName });
                console.log(`Renamed serving food: ${food.name} -> ${newName}`);
            }
        }

        console.log('✨ Done renaming foods!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

run();
