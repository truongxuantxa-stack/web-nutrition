require('dotenv').config();
const { Op } = require('sequelize');
const { Food } = require('./models'); // Make sure this path is correct, or maybe require('./models/index')

async function run() {
    try {
        const foods = await Food.findAll({
            where: {
                [Op.or]: [
                    { sugar: null },
                    { sodium: null }
                ]
            },
            attributes: ['id', 'name', 'category', 'foodType', 'sugar', 'sodium']
        });
        
        console.log(JSON.stringify(foods, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

run();
