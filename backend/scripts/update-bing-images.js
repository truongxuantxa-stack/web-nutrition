'use strict';
/**
 * Cập nhật imageUrl cho tất cả các thực phẩm chưa có ảnh bằng kỹ thuật cào (scraping) Bing Images.
 * Ưu điểm: Miễn phí, không giới hạn request, ảnh món ăn Việt Nam rất chính xác.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');
const { sequelize, Food } = require('../models');

// Hàm cào ảnh từ Bing Images
const searchBingImage = (query, foodType) => {
    return new Promise((resolve) => {
        // Làm sạch tên (bỏ các chữ trong ngoặc như "(Thô)", "(Chín)")
        const cleanName = query.replace(/\s*\(.*?\)\s*/g, '').trim();
        
        // Tối ưu hóa từ khóa tìm kiếm
        let searchQuery = cleanName;
        if (foodType === 'raw') {
            searchQuery = `${cleanName} nguyên liệu tươi sống chưa chế biến`;
        } else {
            searchQuery = `${cleanName} món ăn ngon đẹp mắt`;
        }
        const url = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}&form=HDRSC2`;
        
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Regex tìm đường dẫn URL của ảnh đầu tiên trong kết quả trả về của Bing
                const match = data.match(/murl&quot;:&quot;(.*?)&quot;/);
                if (match && match[1]) {
                    resolve(match[1]);
                } else {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công.');

        // Lấy toàn bộ thực phẩm (cả thô và chế biến) chưa có ảnh
        const foodsWithoutImage = await Food.findAll({
            where: { imageUrl: null, isCustom: false }
        });

        console.log(`Tiến hành cào ảnh cho ${foodsWithoutImage.length} món ăn/nguyên liệu qua Bing Images...`);

        let updated = 0;
        let notFound = 0;

        for (let i = 0; i < foodsWithoutImage.length; i++) {
            const food = foodsWithoutImage[i];
            process.stdout.write(`[${i+1}/${foodsWithoutImage.length}] Đang tìm ảnh cho "${food.name}"... `);
            
            const imageUrl = await searchBingImage(food.name, food.foodType);
            
            if (imageUrl) {
                await food.update({ imageUrl });
                console.log(`✅ Thành công`);
                updated++;
            } else {
                console.log(`❌ Không tìm thấy`);
                notFound++;
            }

            // Chờ 500ms giữa các request để tránh bị block IP tạm thời
            await sleep(500);
        }

        console.log(`\n🎉 Hoàn tất! Đã cập nhật ảnh Bing cho ${updated} thực phẩm, không tìm thấy ${notFound}.`);
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
    } finally {
        await sequelize.close();
        console.log('🔒 Đã đóng kết nối.');
    }
}

run();
