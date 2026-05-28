'use strict';
/**
 * Cập nhật imageUrl cho các thực phẩm chế biến (dish) chưa có ảnh bằng Wikipedia API
 * kết hợp với ảnh fallback chất lượng cao từ Unsplash dựa trên phân loại tên món ăn.
 * 
 * Chạy: node scripts/update-food-images.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const https = require('https');
const { sequelize, Food } = require('../models');

// Danh sách ảnh Unsplash chất lượng cao theo phân loại để làm fallback
const FALLBACK_IMAGES = {
    salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
    noodle: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop', // Phở, bún, mì
    rice: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop', // Cơm, xôi
    bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop', // Bánh mì, bánh ngọt
    drink: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop', // Sinh tố, nước ép
    general: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop' // Các món khác
};

// Hàm chọn ảnh fallback dựa trên tên món ăn
function getFallbackImage(foodName) {
    const nameLower = foodName.toLowerCase();
    if (nameLower.includes('salad') || nameLower.includes('rau') || nameLower.includes('nộm') || nameLower.includes('gỏi')) {
        return FALLBACK_IMAGES.salad;
    }
    if (nameLower.includes('bún') || nameLower.includes('phở') || nameLower.includes('mì') || nameLower.includes('miến') || nameLower.includes('hủ tiếu') || nameLower.includes('cháo') || nameLower.includes('súp')) {
        return FALLBACK_IMAGES.noodle;
    }
    if (nameLower.includes('cơm') || nameLower.includes('xôi')) {
        return FALLBACK_IMAGES.rice;
    }
    if (nameLower.includes('bánh')) {
        return FALLBACK_IMAGES.bread;
    }
    if (nameLower.includes('sinh tố') || nameLower.includes('nước') || nameLower.includes('trà') || nameLower.includes('sữa') || nameLower.includes('nước ép')) {
        return FALLBACK_IMAGES.drink;
    }
    return FALLBACK_IMAGES.general;
}

// Helper gửi request HTTP GET và nhận JSON
const getJson = (url) => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'NutritionAppGraduationProject/1.0 (contact: student@example.com)'
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

// Hàm tìm ảnh trên Wikipedia
const searchWikipediaImage = async (query) => {
    try {
        // Tìm trang Wikipedia tiếng Việt phù hợp nhất
        const searchUrl = `https://vi.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1`;
        const searchResult = await getJson(searchUrl);
        
        if (searchResult.query && searchResult.query.search && searchResult.query.search.length > 0) {
            const title = searchResult.query.search[0].title;
            
            // Lấy ảnh thumbnail kích thước 600px của trang đó
            const imgUrl = `https://vi.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600`;
            const imgResult = await getJson(imgUrl);
            
            const pages = imgResult.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pages[pageId] && pages[pageId].thumbnail) {
                return pages[pageId].thumbnail.source;
            }
        }
        return null;
    } catch (e) {
        return null;
    }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công.');

        // Lấy tất cả các món chế biến (dish) chưa có ảnh
        const dishesWithoutImage = await Food.findAll({
            where: { foodType: 'dish', imageUrl: null, isCustom: false }
        });

        console.log(`Tìm thấy ${dishesWithoutImage.length} món ăn chưa có ảnh trong database.`);
        console.log('Bắt đầu quét ảnh tự động từ Wikipedia + Unsplash Fallback...');

        let updatedWiki = 0;
        let updatedFallback = 0;

        for (let i = 0; i < dishesWithoutImage.length; i++) {
            const food = dishesWithoutImage[i];
            process.stdout.write(`[${i+1}/${dishesWithoutImage.length}] Đang xử lý "${food.name}"... `);

            // 1. Tìm trên Wikipedia trước
            let imageUrl = await searchWikipediaImage(food.name);
            let type = 'Wikipedia';

            // 2. Nếu không tìm thấy, dùng ảnh fallback Unsplash theo từ khóa
            if (!imageUrl) {
                imageUrl = getFallbackImage(food.name);
                type = 'Fallback Unsplash';
                updatedFallback++;
            } else {
                updatedWiki++;
            }

            // Cập nhật vào DB
            await food.update({ imageUrl });
            console.log(`✅ Thành công (${type})`);

            // Chờ 200ms để tránh gửi request quá dồn dập
            await sleep(200);
        }

        console.log(`\n🎉 Hoàn thành cập nhật ảnh cho ${dishesWithoutImage.length} món!`);
        console.log(`- Lấy từ Wikipedia: ${updatedWiki} món.`);
        console.log(`- Dùng ảnh Unsplash Fallback: ${updatedFallback} món.`);

    } catch (err) {
        console.error('❌ Lỗi hệ thống:', err.message);
    } finally {
        await sequelize.close();
        console.log('🔒 Đã đóng kết nối database.');
    }
}

run();
