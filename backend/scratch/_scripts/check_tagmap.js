const fs = require('fs');

const content = fs.readFileSync('seeders/foods.js', 'utf8');
const tagMapMatch = content.match(/const tagMap = (\{[\s\S]*?\});/);

// We can just use eval because it's a JS object literal string
let tagMap;
eval('tagMap = ' + tagMapMatch[1]);

const tplNames = new Set(Object.keys(tagMap));
const mapping = JSON.parse(fs.readFileSync('scratch/food_name_mapping.json'));
const prog = JSON.parse(fs.readFileSync('scratch/generate_progress.json'));
const completed = new Set(prog.completed);

let pendingInTpl = mapping.filter(m => tplNames.has(m.vietnamese) && !completed.has(m.id));

console.log('Pending in templates:', pendingInTpl.length);
if (pendingInTpl.length > 0) {
    console.log(pendingInTpl.map(p => `${p.id} - ${p.vietnamese}`).join('\n'));
}

