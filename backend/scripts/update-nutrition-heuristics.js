require('dotenv').config();
const { Food } = require('./models');
const { Op } = require('sequelize');

async function run() {
    try {
        const foods = await Food.findAll({
            where: {
                [Op.or]: [{ sugar: null }, { sodium: null }]
            }
        });
        
        let updateCount = 0;
        
        for (const food of foods) {
            let sugar = food.sugar;
            let sodium = food.sodium;
            
            const nameLower = food.name.toLowerCase();
            
            // Sodium estimation
            if (sodium === null) {
                if (nameLower.includes('muối') || nameLower.includes('mắm') || nameLower.includes('kho')) {
                    sodium = 1200;
                } else if (food.category === 'pho_bun' || nameLower.includes('lẩu') || nameLower.includes('canh') || nameLower.includes('phở') || nameLower.includes('bún') || nameLower.includes('hủ tiếu')) {
                    sodium = 1000;
                } else if (food.category === 'com' || food.category === 'thit_ca' || nameLower.includes('nướng') || nameLower.includes('chiên')) {
                    sodium = 600;
                } else if (food.category === 'banh' || nameLower.includes('bánh')) {
                    sodium = 300;
                } else if (food.category === 'do_uong' || food.category === 'trai_cay') {
                    sodium = 20;
                } else if (food.category === 'rau_cu' || nameLower.includes('rau') || nameLower.includes('salad')) {
                    sodium = 150;
                } else {
                    sodium = 400; // default savory
                }
            }
            
            // Sugar estimation
            if (sugar === null) {
                if (nameLower.includes('trà sữa') || nameLower.includes('ngọt') || nameLower.includes('sữa đá') || nameLower.includes('milo') || nameLower.includes('chè')) {
                    sugar = 35;
                } else if (nameLower.includes('nước ép') || nameLower.includes('sinh tố') || nameLower.includes('sữa chua') || food.category === 'do_uong') {
                    sugar = 20; // naturally occurring or added
                } else if (nameLower.includes('sữa tươi có đường') || nameLower.includes('mật ong')) {
                    sugar = 25;
                } else if (food.category === 'banh' || nameLower.includes('bánh')) {
                    sugar = 15;
                } else if (food.category === 'com' || food.category === 'pho_bun' || food.category === 'thit_ca' || food.category === 'rau_cu') {
                    sugar = 3; // tiny amount from veggies or marinades
                } else {
                    sugar = 5;
                }
            }
            
            // Specific overrides for accuracy
            if (nameLower.includes('không đường') || nameLower.includes('black coffee') || nameLower === 'cà phê đen không đường' || nameLower === 'trà xanh không đường') {
                sugar = 0;
            }
            if (nameLower.includes('cà phê sữa đá')) {
                sugar = 20;
                sodium = 20;
            }
            if (nameLower.includes('cơm gà hải nam')) {
                sugar = 2;
                sodium = 800; // savory broth/sauce
            }
            if (nameLower.includes('trà sữa')) {
                sugar = 40;
                sodium = 50;
            }
            if (nameLower.includes('thức ăn nhanh') || nameLower.includes('hamburger') || nameLower.includes('pizza') || nameLower.includes('gà rán')) {
                sodium = 1200;
                sugar = 8;
            }
            
            // Save updates
            food.sugar = sugar;
            food.sodium = sodium;
            await food.save();
            updateCount++;
            
            console.log(`Updated ${food.name}: Sugar = ${sugar}g, Sodium = ${sodium}mg`);
        }
        
        console.log(`Successfully updated ${updateCount} foods.`);
    } catch (error) {
        console.error("Error updating nutrition:", error);
    } finally {
        process.exit(0);
    }
}

run();
