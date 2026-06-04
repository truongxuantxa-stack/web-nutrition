require('dotenv').config();
const openfoodfactsService = require('../services/openfoodfacts.service');

async function test() {
    try {
        console.log('Testing OFF API for "Sữa Vinamilk"...');
        const results = await openfoodfactsService.searchOpenFoodFacts('Sữa Vinamilk', 1);
        if (results.length > 0) {
            console.log(JSON.stringify(results[0], null, 2));
        } else {
            console.log('No results found.');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
test();
