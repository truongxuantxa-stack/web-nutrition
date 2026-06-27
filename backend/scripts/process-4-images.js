require('dotenv').config({ path: '../.env' }); // fallback
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { Food } = require('../models');
const { Op } = require('sequelize');

async function processImages() {
  try {
    const imagesToProcess = [
      { input: 'C:\\Users\\Hi Windows 10\\.gemini\\antigravity-ide\\brain\\7bac2ef3-7599-4799-b827-1729edd75836\\vung_me_1782545191556.png', outputFilename: 'vung-me.webp', searchName: 'Vừng', oldFilename: 'vung_me.jfif' },
      { input: 'C:\\Users\\Hi Windows 10\\.gemini\\antigravity-ide\\brain\\7bac2ef3-7599-4799-b827-1729edd75836\\thanh_protein_1782545201442.png', outputFilename: 'thanh-protein.webp', searchName: 'Thanh protein', oldFilename: 'thanh_protein.jfif' },
      { input: 'C:\\Users\\Hi Windows 10\\.gemini\\antigravity-ide\\brain\\7bac2ef3-7599-4799-b827-1729edd75836\\sua_tang_co_1782545210747.png', outputFilename: 'sua-tang-co.webp', searchName: 'Sữa tăng cơ', oldFilename: 'sua_tang_co.jfif' },
      { input: 'C:\\Users\\Hi Windows 10\\.gemini\\antigravity-ide\\brain\\7bac2ef3-7599-4799-b827-1729edd75836\\yen_mach_kho_tho_1782545220929.png', outputFilename: 'yen-mach-kho-tho.webp', searchName: 'Yến mạch', oldFilename: 'yen-mach-kho-tho.webp' }
    ];

    const publicDir = path.join(__dirname, '..', 'public', 'images', 'foods');
    
    for (const item of imagesToProcess) {
      if (!fs.existsSync(item.input)) {
         console.log('Skipping ' + item.input + ' - not found');
         continue;
      }
      
      const outputPath = path.join(publicDir, item.outputFilename);
      
      console.log(`Processing ${item.input} to ${outputPath}`);
      await sharp(item.input)
        .resize(400, 400, { fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(outputPath);
        
      // Delete old file
      if (item.oldFilename && item.oldFilename !== item.outputFilename) {
          const oldPath = path.join(publicDir, item.oldFilename);
          if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
              console.log(`Deleted old file: ${oldPath}`);
          }
      }
      
      // Update DB
      const foods = await Food.findAll({
        where: {
          name: { [Op.like]: `%${item.searchName}%` }
        }
      });
      
      if (foods.length > 0) {
        for (const food of foods) {
           await food.update({ imageUrl: `/images/foods/${item.outputFilename}` });
           console.log(`Updated DB for food: ${food.name} to /images/foods/${item.outputFilename}`);
        }
      } else {
        console.log(`Could not find any food matching ${item.searchName} in DB.`);
      }
    }
    
    console.log('All done!');
  } catch (err) {
    console.error(err);
  } finally {
      process.exit();
  }
}

processImages();
