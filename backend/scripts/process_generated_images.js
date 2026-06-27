const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourceDir = 'C:\\\\Users\\\\Hi Windows 10\\\\.gemini\\\\antigravity-ide\\\\brain\\\\0d2b726c-89ee-4460-b6b3-cb08a13400f7';
const targetDir = 'C:\\\\Users\\\\Hi Windows 10\\\\webdinhduong\\\\backend\\\\public\\\\images\\\\foods';

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.png'));

(async () => {
  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    let baseName = file.split('_').slice(0, -1).join('-');
    const targetPath = path.join(targetDir, baseName + '.webp');
    
    console.log('Processing:', file, '->', baseName + '.webp');
    
    await sharp(sourcePath)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(targetPath);
      
    console.log('Done:', targetPath);
  }
})();
