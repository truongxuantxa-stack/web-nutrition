require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const MealTemplate = require('../models/MealTemplate');

async function main() {
  try {
    const templates = await MealTemplate.findAll({ raw: true });
    let templateFoodIds = new Set();

    templates.forEach(t => {
      let slots = [];
      if (typeof t.slots === 'string') {
        slots = JSON.parse(t.slots);
      } else {
        slots = t.slots;
      }
      if (Array.isArray(slots)) {
        slots.forEach(slot => {
          if (Array.isArray(slot.foodIds)) {
            slot.foodIds.forEach(id => templateFoodIds.add(id));
          }
        });
      }
    });

    const mappingPath = path.join(__dirname, 'food_name_mapping.json');
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));

    const progressPath = path.join(__dirname, 'generate_progress.json');
    let progress = { completed: [], last_batch: 0, items: [] };
    if (fs.existsSync(progressPath)) {
      progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
    }

    const completedIds = new Set(progress.completed || []);

    const pending = mapping.filter(f => !completedIds.has(f.id));

    // Sort by: template foods first
    pending.sort((a, b) => {
      const aInTpl = templateFoodIds.has(a.id);
      const bInTpl = templateFoodIds.has(b.id);
      if (aInTpl && !bInTpl) return -1;
      if (!aInTpl && bInTpl) return 1;
      return 0;
    });

    const nextBatch = pending.slice(0, 20);
    console.log(JSON.stringify(nextBatch, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

main();
