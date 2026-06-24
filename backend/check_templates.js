require('dotenv').config();
const { Food } = require('./models');
const sequelize = require('./config/database');
const fs = require('fs');

async function run() {
    try {
        await sequelize.authenticate();
        const foods = await Food.findAll({ raw: true });
        
        let tplFoods = foods.filter(f => {
            if (!f.foodTags) return false;
            try {
                let tags = typeof f.foodTags === 'string' ? JSON.parse(f.foodTags) : f.foodTags;
                return Array.isArray(tags) && tags.some(t => ['traditional', 'healthy_bowl', 'snack'].includes(t));
            } catch(e) { return false; }
        });
        
        console.log('Total foods with template tags in DB:', tplFoods.length);
        
        const mapping = JSON.parse(fs.readFileSync('scratch/food_name_mapping.json'));
        const prog = JSON.parse(fs.readFileSync('scratch/generate_progress.json'));
        const completed = new Set(prog.completed);
        
        // Items in mapping that have template tags
        const tplNames = new Set(tplFoods.map(f => f.name));
        let pendingInTpl = mapping.filter(m => tplNames.has(m.vietnamese) && !completed.has(m.id));
        
        console.log('Pending template foods:', pendingInTpl.length);
        console.log(pendingInTpl.map(p => p.vietnamese).join(', '));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
