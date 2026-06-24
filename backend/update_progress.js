const fs = require('fs');
const path = require('path');

const progressPath = path.join(__dirname, 'scratch/generate_progress.json');
const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

const completedIds = [
    3659, 3660, 3661, 3662, 3663, 3670, 3673, 3674, 3675, 3676,
    3677, 3678, 3679, 3680, 3681, 3682, 3683
];

const completedSet = new Set(progress.completed);

for (const id of completedIds) {
    if (!completedSet.has(id)) {
        progress.completed.push(id);
        progress.items.push({
            id: id,
            status: "done",
            batch: 5
        });
    }
}

progress.last_batch = 5;

fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
console.log('Updated progress file successfully.');
