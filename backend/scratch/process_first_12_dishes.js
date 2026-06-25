const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
    try {
        const publicDir = path.join(__dirname, '../public/images/foods');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        const items = [
            { id: 4124, slug: 'salad_uc_ga_ap_chao' },
            { id: 4125, slug: 'com_gao_lut_thit_bo' },
            { id: 4126, slug: 'banh_mi_ngu_coc_trung' },
            { id: 4127, slug: 'pho_ga' },
            { id: 4128, slug: 'bun_bo_hue' },
            { id: 4129, slug: 'com_tam_suon' },
            { id: 4130, slug: 'bun_cha' },
            { id: 4131, slug: 'bun_dau_mam_tom' },
            { id: 4132, slug: 'banh_mi_pate_xa_xiu' },
            { id: 4133, slug: 'mien_luon' },
            { id: 4134, slug: 'mi_tom_trung' },
            { id: 4135, slug: 'xoi_xeo' }
        ];

        const brainDir = path.join(process.env.USERPROFILE || 'C:\\Users\\Hi Windows 10', '.gemini', 'antigravity-ide', 'brain');
        function findPngs(dir, fileList = []) {
            if (!fs.existsSync(dir)) return fileList;
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    findPngs(filePath, fileList);
                } else if (file.endsWith('.png')) {
                    fileList.push(filePath);
                }
            }
            return fileList;
        }

        const allPngs = findPngs(brainDir);

        const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
            host: process.env.DB_HOST,
            dialect: 'mysql',
            logging: false
        });

        for (const item of items) {
            const targetFilename = item.slug.replace(/_/g, '-') + '.webp';
            const targetPath = path.join(publicDir, targetFilename);

            const sourcePng = allPngs.find(p => path.basename(p).startsWith(item.slug + '_'));

            if (sourcePng) {
                console.log(`Optimizing: ${sourcePng} -> ${targetFilename}`);
                await sharp(sourcePng)
                    .resize(400, 400, {
                        fit: sharp.fit.cover,
                        position: sharp.strategy.attention
                    })
                    .webp({ quality: 80 })
                    .toFile(targetPath);
                
                // Update DB
                const dbUrl = `/images/foods/${targetFilename}`;
                await sequelize.query('UPDATE Foods SET imageUrl = ? WHERE id = ?', {
                    replacements: [dbUrl, item.id]
                });
                console.log(`Updated DB for ID ${item.id} -> ${dbUrl}`);
            } else {
                console.log(`Warning: Could not find source PNG for ${item.slug}`);
            }
        }

        console.log(`Optimization and DB Update Complete!`);
        process.exit();
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

main();
