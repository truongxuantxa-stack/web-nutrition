require('dotenv').config();
const { Food } = require('../models');

async function fix() {
  try {
    const [numAffected] = await Food.update(
      { foodType: 'raw' },
      { where: { dataSource: 'openfoodfacts', foodType: 'dish' } }
    );
    console.log(`Fixed ${numAffected} foods in DB.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
