const fs = require('fs');

const progress = JSON.parse(fs.readFileSync('scratch/generate_progress.json', 'utf8'));
const mapping = JSON.parse(fs.readFileSync('scratch/food_name_mapping.json', 'utf8'));

// Get all pending items
const pendingItems = progress.items.filter(i => i.status === 'pending');

// Map with details
const itemsWithDetails = pendingItems.map(p => {
  const details = mapping.find(m => m.id === p.id);
  return {
    ...p,
    ...details
  };
});

// Heuristic for popular Vietnamese cooked dishes
// Prioritize: foodType = 'dish', categories like 'pho', 'com', 'bun', 'banh-mi'
const popularCategories = ['pho', 'com', 'bun', 'banh-mi', 'mon-nuoc', 'mon-kho'];

const sortedItems = itemsWithDetails.sort((a, b) => {
  // 1. Dish vs Raw
  if (a.foodType === 'dish' && b.foodType !== 'dish') return -1;
  if (a.foodType !== 'dish' && b.foodType === 'dish') return 1;

  // 2. Popular categories
  const aPopular = popularCategories.includes(a.category) ? 1 : 0;
  const bPopular = popularCategories.includes(b.category) ? 1 : 0;
  if (aPopular > bPopular) return -1;
  if (aPopular < bPopular) return 1;

  return 0;
});

const nextBatch = sortedItems.slice(0, 20);

console.log(JSON.stringify(nextBatch, null, 2));
