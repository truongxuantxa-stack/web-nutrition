require('dotenv').config();
const { Food } = require('./models');

async function updateImages() {
    try {
        const foods = await Food.findAll({
            where: {
                name: {
                    [require('sequelize').Op.like]: '%sữa tăng cơ%'
                }
            }
        });
        console.log("Foods found for sữa tăng cơ:");
        foods.forEach(f => console.log(`- ${f.name} (${f.id}): ${f.imageURL}`));

        const eggs = await Food.findAll({
            where: {
                name: {
                    [require('sequelize').Op.like]: '%trứng%'
                }
            }
        });
        console.log("\nFoods found for trứng:");
        eggs.forEach(f => console.log(`- ${f.name} (${f.id}): ${f.imageURL}`));
        
        const proteins = await Food.findAll({
            where: {
                name: {
                    [require('sequelize').Op.like]: '%protein%'
                }
            }
        });
        console.log("\nFoods found for protein:");
        proteins.forEach(f => console.log(`- ${f.name} (${f.id}): ${f.imageURL}`));
        
        const me = await Food.findAll({
            where: {
                name: {
                    [require('sequelize').Op.like]: '%mè%'
                }
            }
        });
        console.log("\nFoods found for mè:");
        me.forEach(f => console.log(`- ${f.name} (${f.id}): ${f.imageURL}`));
        
        const vung = await Food.findAll({
            where: {
                name: {
                    [require('sequelize').Op.like]: '%vừng%'
                }
            }
        });
        console.log("\nFoods found for vừng:");
        vung.forEach(f => console.log(`- ${f.name} (${f.id}): ${f.imageURL}`));
        
        const dau = await Food.findAll({
            where: {
                name: {
                    [require('sequelize').Op.like]: '%dầu%'
                }
            }
        });
        console.log("\nFoods found for dầu:");
        dau.forEach(f => console.log(`- ${f.name} (${f.id}): ${f.imageURL}`));
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
updateImages();
