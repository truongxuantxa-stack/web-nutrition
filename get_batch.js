const fs = require('fs');
const progress = JSON.parse(fs.readFileSync('backend/scratch/generate_progress.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('backend/scratch/food_name_mapping.json', 'utf8'));

const pendingItems = progress.items.filter(item => item.status === 'pending').slice(0, 20);

const batchItems = pendingItems.map(pItem => {
  const mapItem = mapping.find(m => m.id === pItem.id);
  return { ...pItem, ...mapItem };
});

console.log(JSON.stringify(batchItems, null, 2));
