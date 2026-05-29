'use strict';
require('dotenv').config();
const { DiaryEntry, Food } = require('../models');

async function backfillSnapshots() {
    try {
        const entries = await DiaryEntry.findAll({
            include: [{ model: Food, as: 'food' }]
        });
        
        let updated = 0;
        for (const entry of entries) {
            const food = entry.food;
            if (!food) continue;
            
            const isRaw = food.foodType === 'raw';
            const factor = isRaw ? entry.amount / 100 : entry.amount;
            
            // Only backfill if they are null but food has data
            if (entry.vitaminASnapshot == null && food.vitaminA != null) {
                entry.vitaminASnapshot = Math.round(food.vitaminA * factor * 10) / 10;
            }
            if (entry.vitaminCSnapshot == null && food.vitaminC != null) {
                entry.vitaminCSnapshot = Math.round(food.vitaminC * factor * 10) / 10;
            }
            if (entry.calciumSnapshot == null && food.calcium != null) {
                entry.calciumSnapshot = Math.round(food.calcium * factor * 10) / 10;
            }
            if (entry.ironSnapshot == null && food.iron != null) {
                entry.ironSnapshot = Math.round(food.iron * factor * 10) / 10;
            }
            if (entry.fiberSnapshot == null && food.fiber != null) {
                entry.fiberSnapshot = Math.round(food.fiber * factor * 10) / 10;
            }
            if (entry.sugarSnapshot == null && food.sugar != null) {
                entry.sugarSnapshot = Math.round(food.sugar * factor * 10) / 10;
            }
            if (entry.sodiumSnapshot == null && food.sodium != null) {
                entry.sodiumSnapshot = Math.round(food.sodium * factor * 10) / 10;
            }
            
            if (entry.changed()) {
                await entry.save();
                updated++;
            }
        }
        console.log(`✅ Backfilled snapshots cho ${updated} entries.`);
    } catch (err) {
        console.error('Lỗi backfill:', err);
    } finally {
        process.exit();
    }
}

backfillSnapshots();
