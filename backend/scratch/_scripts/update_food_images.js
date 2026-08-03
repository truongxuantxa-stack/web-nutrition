require('dotenv').config();
const { Food } = require('./models');

async function updateImages() {
    try {
        const updates = {
            2117: '/images/foods/sua_tang_co.jfif',
            2118: '/images/foods/thanh_protein.jfif',
            2088: '/images/foods/long_trang_trung.webp',
            2114: '/images/foods/trung_cut.webp',
            2115: '/images/foods/trung_ga.webp',
            2173: '/images/foods/dau_dua.webp',
            2174: '/images/foods/vung_me.jfif'
        };

        for (const [id, imageUrl] of Object.entries(updates)) {
            await Food.update({ imageUrl }, { where: { id } });
            console.log(`Updated food ${id} with image ${imageUrl}`);
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
updateImages();
