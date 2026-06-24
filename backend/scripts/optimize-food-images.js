const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const artifactsDir = 'C:\\Users\\Hi Windows 10\\.gemini\\antigravity-ide\\brain\\95d4f449-fd3c-4d93-a716-737cdda6b0ff';
const mappingFile = path.resolve(__dirname, '../scratch/food_name_mapping.json');
const publicFoodsDir = path.resolve(__dirname, '../public/images/foods');

if (!fs.existsSync(publicFoodsDir)) {
    fs.mkdirSync(publicFoodsDir, { recursive: true });
}

const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));

async function main() {
    const files = fs.readdirSync(artifactsDir);
    const pngFiles = files.filter(f => f.startsWith('food_') && f.endsWith('.png'));
    
    let processedCount = 0;
    for (const file of pngFiles) {
        const match = file.match(/^food_(\d+)_/);
        if (!match) continue;
        
        const id = parseInt(match[1]);
        const mappedItem = mapping.find(item => item.id === id);
        
        if (!mappedItem) {
            console.log(`Bỏ qua file ${file} vì không tìm thấy ID ${id} trong mapping`);
            continue;
        }

        const sourcePath = path.join(artifactsDir, file);
        const destPath = path.join(publicFoodsDir, mappedItem.filename);

        try {
            await sharp(sourcePath)
                .resize(400, 400, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(destPath);
            
            console.log(`✅ [${id}] Resize & Convert: ${file} -> ${mappedItem.filename}`);
            processedCount++;
        } catch (err) {
            console.error(`❌ Lỗi xử lý ${file}:`, err.message);
        }
    }

    console.log(`\nHoàn thành xử lý ${processedCount} ảnh.`);
}

main();
