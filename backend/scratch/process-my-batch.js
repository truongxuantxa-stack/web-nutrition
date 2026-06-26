const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const batchMap = [
  { id: 3888, file: "southern_style_beef_vermicelli_3888", target: "bun-bo-nam-bo.webp" },
  { id: 3898, file: "vermicelli_with_lemongrass_beef_3898", target: "bun-bo-xao-sa.webp" },
  { id: 3899, file: "sour_soup_with_shrimp_3899", target: "canh-chua-tom.webp" },
  { id: 3900, file: "tofu_with_minced_pork_sauce_3900", target: "dau-phu-sot-thit-bam.webp" },
  { id: 3901, file: "boiled_mustard_greens_with_fish_sauce_3901", target: "rau-cai-luoc-cham-mam.webp" },
  { id: 3902, file: "vietnamese_grilled_rice_paper_with_cheese_3902", target: "banh-trang-nuong-phomai.webp" },
  { id: 3903, file: "vietnamese_mixed_rice_paper_salad_3903", target: "banh-trang-tron.webp" },
  { id: 3904, file: "cheese_shaken_sweet_potatoes_3904", target: "khoai-lang-lac-pho-mai.webp" },
  { id: 3905, file: "boiled_corn_3905", target: "ngo-luoc.webp" },
  { id: 3906, file: "boiled_sweet_potato_3906", target: "khoai-lang-luoc.webp" },
  { id: 3907, file: "fried_banana_3907", target: "chuoi-lan.webp" },
  { id: 3908, file: "green_guava_with_chili_salt_3908", target: "oi-xanh-cham-muoi-ot.webp" },
  { id: 3909, file: "mung_bean_sweet_soup_3909", target: "che-dau-xanh.webp" },
  { id: 3910, file: "three_color_sweet_dessert_3910", target: "che-ba-mau.webp" },
  { id: 3911, file: "pomelo_and_grass_jelly_sweet_soup_3911", target: "che-buoi-suong-sao.webp" },
  { id: 3912, file: "yogurt_with_black_glutinous_rice_3912", target: "sua-chua-nep-cam.webp" },
  { id: 3913, file: "salt_roasted_cashews_3913", target: "hat-dieu-rang-muoi.webp" }
];

async function main() {
  const publicDir = path.join(__dirname, '../public/images/foods');
  const brainDir = path.join(process.env.USERPROFILE, '.gemini', 'antigravity-ide', 'brain', '3d9cbce5-8a98-442a-a595-588e8ea30b16');
  
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
  console.log('Updated generate_progress.json');
}

main();
