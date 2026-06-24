const fs = require('fs');
const path = require('path');

const progressPath = path.join(__dirname, 'generate_progress.json');
const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

const newIds = [
  3706, 3707, 3708, 3709, 3710, 
  3713, 3714, 3715, 3716, 3717, 
  3718, 3719, 3720, 3721, 3722, 
  3723, 3724
];

progress.completed.push(...newIds);
progress.last_batch = 7;

const newItems = newIds.map(id => ({
  id,
  status: 'done',
  batch: 7
}));

progress.items.push(...newItems);

fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
console.log('Added 17 items to generate_progress.json');
