require('dotenv').config({ path: '../.env' });
const { Food } = require('../models');

async function run() {
  try {
    await Food.update({imageUrl: '/images/foods/chao-yen-mach-sua-tuoi.webp'}, {where: {name: 'Cháo Yến Mạch Sữa Tươi'}});
    await Food.update({imageUrl: '/images/foods/yen-mach-trai-cay-hat.webp'}, {where: {name: 'Yến Mạch Trái Cây Hạt'}});
    await Food.update({imageUrl: '/images/foods/banh-pancake-chuoi-yen-mach.webp'}, {where: {name: 'Bánh Pancake Chuối Yến Mạch'}});
    await Food.update({imageUrl: '/images/foods/smoothie-protein-chuoi-yen-mach.webp'}, {where: {name: 'Smoothie Protein Chuối Yến Mạch'}});
    await Food.update({imageUrl: '/images/foods/sua-yen-mach-oat-milk.webp'}, {where: {name: 'Sữa Yến Mạch (Oat Milk)'}});
    console.log('Fixed DB URLs');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
run();
