'use strict';
/**
 * Cập nhật imageUrl cho các thực phẩm thô chưa có ảnh bằng Pexels API.
 * Chạy: node scripts/update-pexels-images.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');
const { sequelize, Food } = require('../models');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'YOUR_PEXELS_API_KEY';

// Hàm helper gọi Pexels API
const searchPexelsImage = (query) => {
    return new Promise((resolve, reject) => {
        // Dọn dẹp tên để tìm kiếm tốt hơn (bỏ các chữ trong ngoặc)
        const cleanQuery = query.replace(/\(.*\)/g, '').trim();
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanQuery)}&locale=vi-VN&per_page=1`;
        
        const options = {
            headers: {
                Authorization: PEXELS_API_KEY
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.photos && json.photos.length > 0) {
                        // Chọn size vừa phải để tối ưu tốc độ tải (landscape hoặc medium)
                        resolve(json.photos[0].src.landscape || json.photos[0].src.medium);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.error('Lỗi khi gọi Pexels API:', err.message);
            resolve(null);
        });
    });
};

// Hàm delay để tránh bị rate limit (Pexels giới hạn 200 req/giờ, nhưng gọi liên tục có thể bị chặn)
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅  Kết nối database thành công.');

        // Chỉ lấy những món raw chưa có ảnh (101 món)
        const rawFoodsWithoutImage = await Food.findAll({
            where: { foodType: 'raw', imageUrl: null, isCustom: false }
        });

        console.log(`Tiến hành tìm ảnh cho ${rawFoodsWithoutImage.length} món ăn qua Pexels API...`);

        let updated = 0;
        let notFound = 0;

        for (let i = 0; i < rawFoodsWithoutImage.length; i++) {
            const food = rawFoodsWithoutImage[i];
            process.stdout.write(`Đang tìm ảnh cho "${food.name}"... `);
            
            const imageUrl = await searchPexelsImage(food.name);
            
            if (imageUrl) {
                await food.update({ imageUrl });
                console.log(`✅ Thành công`);
                updated++;
            } else {
                console.log(`❌ Không tìm thấy`);
                notFound++;
            }

            // Chờ 500ms giữa các request để đảm bảo an toàn API rate limit
            await sleep(500);
        }

        console.log(`\n🎉  Hoàn tất! Đã cập nhật ảnh Pexels cho ${updated} món, không tìm thấy ${notFound} món.`);
    } catch (err) {
        console.error('❌  Lỗi:', err.message);
    } finally {
        await sequelize.close();
        console.log('🔒  Đã đóng kết nối.');
    }
}

run();
