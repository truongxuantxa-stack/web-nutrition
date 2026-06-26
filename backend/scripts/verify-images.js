require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Food } = require('../models');

async function verify() {
  const foods = await Food.findAll({ where: { isCustom: false } });
  
  let nullCount = 0;
  let correctCount = 0;
  let missingFileCount = 0;
  let totalImagesOnDisk = 0;

  const publicDir = path.join(__dirname, '../public/images/foods');
  if (fs.existsSync(publicDir)) {
      totalImagesOnDisk = fs.readdirSync(publicDir).filter(f => f.endsWith('.webp')).length;
  }

  for (const food of foods) {
    if (!food.imageUrl) {
      nullCount++;
    } else if (food.imageUrl.startsWith('/images/foods/') || food.imageUrl.includes('wikimedia')) {
      correctCount++;
      if (food.imageUrl.startsWith('/images/foods/')) {
        const filePath = path.join(__dirname, '../public', food.imageUrl);
        if (!fs.existsSync(filePath)) {
          missingFileCount++;
          console.log(`Missing file for ID ${food.id}: ${food.imageUrl}`);
        }
      }
    } else {
       console.log(`Invalid imageUrl for ID ${food.id}: ${food.imageUrl}`);
    }
  }

  console.log('--- Verification Report ---');
  console.log(`Total System Foods: ${foods.length}`);
  console.log(`Foods with correct URL format: ${correctCount} (${((correctCount/foods.length)*100).toFixed(2)}%)`);
  console.log(`Foods with null URL: ${nullCount}`);
  console.log(`Foods pointing to missing local files: ${missingFileCount}`);
  console.log(`Total local .webp images on disk: ${totalImagesOnDisk}`);
}

verify().catch(console.error).finally(() => process.exit(0));
