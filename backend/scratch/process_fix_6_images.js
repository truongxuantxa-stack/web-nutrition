const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const batchMap = [
  { id: 4385, file: "ca_basa_4385", target: "ca-basa.webp" },
  { id: 4408, file: "bi_do_bi_ngo_4408", target: "bi-do-bi-ngo.webp" },
  { id: 4521, file: "bo_xao_can_tay_4521", target: "bo-xao-can-tay.webp" },
  { id: 4548, file: "ca_basa_hap_gung_4548", target: "ca-basa-hap-gung.webp" },
  { id: 4576, file: "bap_cai_cuon_thit_hap_4576", target: "bap-cai-cuon-thit-hap.webp" },
  { id: 4590, file: "ca_chem_hap_hong_kong_4590", target: "ca-chem-hap-hong-kong.webp" }
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
}

main();
