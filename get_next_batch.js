require('dotenv').config({ path: './backend/.env' });
const fs = require('fs');
const path = require('path');
const { MealTemplate } = require('./backend/models');
const sequelize = require('./backend/config/database');

async function main() {
    try {
        await sequelize.authenticate();
        const templates = await MealTemplate.findAll({ raw: true });
        let templateFoodIds = new Set();
        for (let t of templates) {
            if (t.slots) {
                let slots;
                try {
                    slots = typeof t.slots === 'string' ? JSON.parse(t.slots) : t.slots;
                } catch(e) {}
                if (slots) {
                    for (let slot of slots) {
                        if (slot.defaultFoodId) templateFoodIds.add(slot.defaultFoodId);
                        if (slot.alternatives) {
                            slot.alternatives.forEach(id => templateFoodIds.add(id));
                        }
                    }
                }
            }
        }
        
        const mappingPath = path.join(__dirname, 'backend/scratch/food_name_mapping.json');
        const progressPath = path.join(__dirname, 'backend/scratch/generate_progress.json');
        
        const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
        const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
        
        const completedSet = new Set(progress.completed);
        
        let pending = mapping.filter(item => !completedSet.has(item.id));
        
        // Sort: template foods first
        pending.sort((a, b) => {
            const aInTpl = templateFoodIds.has(a.id) ? 1 : 0;
            const bInTpl = templateFoodIds.has(b.id) ? 1 : 0;
            return bInTpl - aInTpl;
        });
        
        const nextBatch = pending.slice(0, 20);
        console.log(JSON.stringify(nextBatch, null, 2));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
main();
