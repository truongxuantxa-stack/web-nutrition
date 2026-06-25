const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const batchMap = [
  { id: 3929, file: "mixed_vegetarian_rice", target: "com-chay-thap-cam.webp" },
  { id: 3922, file: "saigon_claypot_rice", target: "com-nieu-sai-gon.webp" },
  { id: 3897, file: "steamed_egg_meatloaf", target: "com-cha-trung.webp" },
  { id: 3896, file: "grilled_chicken_rice", target: "com-dui-ga-nuong.webp" },
  { id: 3895, file: "white_rice_vegetables", target: "com-trang-rau-xao.webp" },
  { id: 3894, file: "braised_fish_rice", target: "com-ca-kho-to.webp" },
  { id: 3893, file: "caramelized_pork_rice", target: "com-thit-kho-tieu.webp" },
  { id: 3892, file: "sour_fish_soup", target: "com-canh-chua-ca.webp" },
  { id: 3891, file: "beef_stew_rice", target: "com-bo-kho.webp" },
  { id: 3890, file: "fish_sauce_chicken", target: "com-ga-chien-nuoc-mam.webp" },
  { id: 3889, file: "grilled_pork_chop_mustard", target: "com-suon-cai.webp" },
  { id: 3881, file: "minced_pork_congee", target: "chao-thit-bam.webp" },
  { id: 3880, file: "mung_bean_congee", target: "chao-dau-xanh.webp" },
  { id: 3879, file: "corn_sticky_rice", target: "xoi-ngo-mo-hanh.webp" },
  { id: 3878, file: "peanut_sticky_rice", target: "xoi-lac.webp" },
  { id: 3877, file: "mung_bean_sticky_rice", target: "xoi-dau-xanh.webp" },
  { id: 3876, file: "chicken_sticky_rice", target: "xoi-ga.webp" }
];

async function main() {
  const publicDir = path.join(__dirname, '../public/images/foods');
  const brainDir = path.join(process.env.USERPROFILE, '.gemini', 'antigravity-ide', 'brain', '8ff633cd-86d5-4e0e-a794-6ee981c2a0ae');
  
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
      progress.items.push({
        id: item.id,
        status: "done",
        batch: currentBatch
      });
    }
  }
  progress.last_batch = currentBatch;
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  console.log('Updated generate_progress.json');
}

main();
