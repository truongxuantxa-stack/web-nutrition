const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const batchMap = [
  { id: 3864, file: "stir_fried_chicken_with_cashews", target: "ga-xao-hat-dieu.webp" },
  { id: 3865, file: "kohlrabi_soup_with_pork_ribs", target: "canh-su-hao-nau-suon.webp" },
  { id: 3866, file: "la_vong_grilled_fish", target: "cha-ca-la-vong.webp" },
  { id: 3867, file: "mi_quang_noodle", target: "mi-quang.webp" },
  { id: 3868, file: "chau_doc_fish_noodle_soup", target: "bun-ca-chau-doc.webp" },
  { id: 3869, file: "nam_vang_noodle_soup", target: "hu-tieu-nam-vang.webp" },
  { id: 3871, file: "vegetarian_fresh_spring_rolls", target: "goi-cuon-chay.webp" },
  { id: 3872, file: "kale_quinoa_salad", target: "salad-kale-hat-quinoa.webp" },
  { id: 3873, file: "banh_mi_with_cold_cuts", target: "banh-mi-thit-nguoi.webp" },
  { id: 3874, file: "banh_mi_with_fried_eggs", target: "banh-mi-op-la.webp" },
  { id: 3875, file: "vietnamese_sizzling_banh_mi_pan", target: "banh-mi-chao-het-thu.webp" },
  { id: 3882, file: "pyramid_meat_dumpling", target: "banh-gio.webp" },
  { id: 3883, file: "pork_bun", target: "banh-bao-thit.webp" },
  { id: 3884, file: "vegetarian_steamed_bun", target: "banh-bao-chay.webp" },
  { id: 3885, file: "steamed_rice_paper_with_sausage", target: "banh-uot-cha-lua.webp" },
  { id: 3886, file: "dry_noodle_with_pork", target: "hu-tieu-kho-thit.webp" },
  { id: 3887, file: "dry_egg_noodles_with_char_siu", target: "mi-kho-xa-xiu.webp" }
];

async function main() {
  const publicDir = path.join(__dirname, '../public/images/foods');
  const brainDir = path.join(process.env.USERPROFILE, '.gemini', 'antigravity-ide', 'brain', 'ab87f2f5-e32b-40fb-912f-cafe32f31583');
  
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
