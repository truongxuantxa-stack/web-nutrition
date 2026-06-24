const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob'); // maybe not installed? Let's use pure JS or fs.readdir
const { execSync } = require('child_process');

async function main() {
    try {
        console.log('--- Step 4: Optimize Food Images ---');
        
        const publicDir = path.join(__dirname, '../public/images/foods');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        const mappingPath = path.join(__dirname, '../scratch/food_name_mapping.json');
        const progressPath = path.join(__dirname, '../scratch/generate_progress.json');

        const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
        const progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));

        const completedSet = new Set(progress.completed);
        
        // Find all generated images in the brain directory
        const brainDir = path.join(process.env.USERPROFILE, '.gemini', 'antigravity-ide', 'brain');
        console.log('Searching for generated images in:', brainDir);
        
        // A simple recursive directory search for .png files
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
        console.log(`Found ${allPngs.length} total PNGs in brain directory.`);

        let optimizedCount = 0;
        let skippedCount = 0;

        for (const item of mapping) {
            if (completedSet.has(item.id)) {
                const targetFilename = item.filename; // e.g., "banh-pho-tuoi.webp"
                const targetPath = path.join(publicDir, targetFilename);

                if (fs.existsSync(targetPath)) {
                    // Already optimized
                    skippedCount++;
                    continue;
                }

                // Need to find the source PNG
                // The filename might have underscores instead of hyphens, e.g., "banh_pho_tuoi_1234.png"
                const prefix = targetFilename.replace('.webp', '').replace(/-/g, '_');
                const sourcePng = allPngs.find(p => path.basename(p).startsWith(prefix + '_') || path.basename(p) === prefix + '.png' || path.basename(p).startsWith(targetFilename.replace('.webp', '') + '_'));

                if (sourcePng) {
                    console.log(`Optimizing: ${sourcePng} -> ${targetFilename}`);
                    await sharp(sourcePng)
                        .resize(400, 400, {
                            fit: sharp.fit.cover,
                            position: sharp.strategy.attention
                        })
                        .webp({ quality: 80 })
                        .toFile(targetPath);
                    optimizedCount++;
                } else {
                    console.log(`Warning: Could not find source PNG for ${item.vietnamese} (${targetFilename})`);
                }
            }
        }

        console.log(`\nOptimization Complete!`);
        console.log(`- Optimized: ${optimizedCount}`);
        console.log(`- Skipped (already exists): ${skippedCount}`);

    } catch (e) {
        console.error('Error optimizing images:', e);
    }
}

main();
