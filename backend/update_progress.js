const fs = require('fs');
const path = require('path');

const progressPath = path.join(__dirname, 'scratch/generate_progress.json');
const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

const completedIds = [
    3684, 3685, 3686, 3687, 3688, 3689, 3690, 3691,
    3696, 3697, 3698, 3699, 3700, 3701, 3702, 3704, 3705
];

const completedSet = new Set(progress.completed);

for (const id of completedIds) {
    if (!completedSet.has(id)) {
        progress.completed.push(id);
        progress.items.push({
            id: id,
            status: "done",
            batch: 6
        });
    }
}

progress.last_batch = 6;

fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
console.log('Updated progress file successfully. 17 items added to batch 6.');
