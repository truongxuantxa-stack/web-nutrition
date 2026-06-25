const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const batchMap = [
  { id: 3792, file: "salad_quinoa_rau_cu_3792", target: "salad-quinoa-rau-cu.webp" },
  { id: 3793, file: "uc_ga_nuong_mat_ong_3793", target: "uc-ga-nuong-mat-ong.webp" },
  { id: 3794, file: "ca_ngu_ap_chao_salad_3794", target: "ca-ngu-ap-chao-salad.webp" },
  { id: 3795, file: "sup_bi_do_kem_tuoi_3795", target: "sup-bi-do-kem-tuoi.webp" },
  { id: 3797, file: "bun_gao_lut_tom_hap_3797", target: "bun-gao-lut-tom-hap.webp" },
  { id: 3798, file: "salad_trung_luoc_rau_mam_3798", target: "salad-trung-luoc-rau-mam.webp" },
  { id: 3799, file: "tom_hap_sa_3799", target: "tom-hap-sa.webp" },
  { id: 3800, file: "ca_dieu_hong_hap_hanh_3800", target: "ca-dieu-hong-hap-hanh.webp" },
  { id: 3801, file: "ga_luoc_la_chanh_3801", target: "ga-luoc-la-chanh.webp" },
  { id: 3802, file: "bo_cuon_la_lot_nuong_3802", target: "bo-cuon-la-lot-nuong.webp" },
  { id: 3803, file: "dau_hu_sot_nam_3803", target: "dau-hu-sot-nam.webp" },
  { id: 3804, file: "cai_bo_xoi_xao_toi_3804", target: "cai-bo-xoi-xao-toi.webp" },
  { id: 3805, file: "bong_cai_xanh_luoc_3805", target: "bong-cai-xanh-luoc.webp" },
  { id: 3806, file: "mang_tay_xao_tom_3806", target: "mang-tay-xao-tom.webp" },
  { id: 3807, file: "canh_rau_ngot_thit_bam_3807", target: "canh-rau-ngot-thit-bam.webp" },
  { id: 3808, file: "canh_bi_dao_tom_kho_3808", target: "canh-bi-dao-tom-kho.webp" }
];

async function main() {
  const publicDir = path.join(__dirname, '../public/images/foods');
  const brainDir = path.join(process.env.USERPROFILE, '.gemini', 'antigravity-ide', 'brain', 'a0bde50e-fd33-4854-abd8-910e4596f360');
  
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
      // also update the original pending items to done
      const pItem = progress.items.find(i => i.id === item.id && i.status === 'pending');
      if (pItem) pItem.status = 'done';
    }
  }
  progress.last_batch = currentBatch;
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  console.log('Updated generate_progress.json');
}

main();
