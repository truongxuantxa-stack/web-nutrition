const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const batchMap = [
  { id: 3967, file: "honey_lemon_tea_3967", target: "tra-chanh-mat-ong.webp" },
  { id: 3968, file: "honey_ginger_tea_3968", target: "tra-gung-mat-ong.webp" },
  { id: 3969, file: "black_coffee_no_sugar_3969", target: "ca-phe-den-khong-duong.webp" },
  { id: 3970, file: "vietnamese_iced_milk_coffee_3970", target: "ca-phe-sua-da.webp" },
  { id: 3971, file: "cappuccino_3971", target: "cappuccino.webp" },
  { id: 3972, file: "latte_3972", target: "latte.webp" },
  { id: 3973, file: "fresh_coconut_water_3973", target: "nuoc-dua-tuoi.webp" },
  { id: 3974, file: "salted_lemonade_3974", target: "nuoc-chanh-muoi.webp" },
  { id: 3975, file: "ching_bo_leung_sweet_soup_3975", target: "nuoc-sam-bo-luong.webp" },
  { id: 3976, file: "pennywort_juice_with_mung_bean_3976", target: "nuoc-rau-ma-dau-xanh.webp" },
  { id: 3977, file: "iced_tea_3977", target: "tra-da.webp" }
];

async function main() {
  const publicDir = path.join(__dirname, '../public/images/foods');
  const brainDir = path.join(process.env.USERPROFILE, '.gemini', 'antigravity-ide', 'brain', '0f444da1-bb61-44d7-8de7-82522853497d');
  
  if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
  }

  const allPngs = fs.readdirSync(brainDir).filter(f => f.endsWith('.png')).map(f => path.join(brainDir, f));

  let optimized = 0;
  for (const item of batchMap) {
    const sourcePng = allPngs.find(p => path.basename(p).startsWith(item.file + '_'));
    if (sourcePng) {
      const targetPath = path.join(publicDir, item.target);
      console.log(`Optimizing: ${path.basename(sourcePng)} -> ${item.target}`);
      await sharp(sourcePng)
        .resize(400, 400, {
            fit: sharp.fit.cover,
            position: sharp.strategy.attention
        })
        .webp({ quality: 80 })
        .toFile(targetPath);
      optimized++;
    } else {
      console.log(`Warning: Could not find PNG for ${item.file}`);
    }
  }
  
  console.log(`Optimized ${optimized} images.`);
  
  // Update generate_progress.json
  const progressPath = path.join(__dirname, '../scratch/generate_progress.json');
  const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
  
  const currentBatch = progress.last_batch + 1;
  for (const item of batchMap) {
    if (!progress.completed.includes(item.id)) {
      progress.completed.push(item.id);
      
      const pItem = progress.items.find(i => i.id === item.id);
      if (pItem) {
        pItem.status = "done";
        pItem.batch = currentBatch;
      } else {
        progress.items.push({
          id: item.id,
          status: "done",
          batch: currentBatch
        });
      }
    }
  }
  progress.last_batch = currentBatch;
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  console.log('Updated generate_progress.json with batch ' + currentBatch);
}

main();
