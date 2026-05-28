'use strict';
/**
 * Cập nhật imageUrl cho các thực phẩm chế biến (dish) chưa có ảnh bằng Google Custom Search API.
 * Chạy: node scripts/update-google-images.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');
const { sequelize, Food } = require('../models');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;

if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    console.error('❌ Lỗi: Cần cung cấp GOOGLE_API_KEY và GOOGLE_CX trong file .env');
    process.exit(1);
}

// Hàm helper gọi Google Custom Search API
const searchGoogleImage = (query) => {
    return new Promise((resolve, reject) => {
        // Thêm chữ "món ăn" hoặc "đẹp" để Google ưu tiên trả về ảnh món ăn đẹp
        const searchQuery = `${query} món ăn`;
        
        // searchType=image để chỉ lấy hình ảnh
        // imgSize=large hoặc medium để lấy ảnh chất lượng tốt
        const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}&searchType=image&imgSize=large&num=1`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) {
                        console.error('\nLỗi API:', json.error.message);
                    }
                    if (json.items && json.items.length > 0) {
                        resolve(json.items[0].link);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    console.error('Lỗi parse JSON:', e.message);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.error('Lỗi khi gọi Google API:', err.message);
            resolve(null);
        });
    });
};

// Hàm delay để tránh bị rate limit (Google giới hạn 100 req/ngày miễn phí, tốc độ không quá gắt nhưng nên có delay)
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅  Kết nối database thành công.');

        // Lấy những món chế biến (dish) chưa có ảnh
        const foodsWithoutImage = await Food.findAll({
            where: { imageUrl: null, isCustom: false }
        });

        console.log(`Tiến hành tìm ảnh cho ${foodsWithoutImage.length} món ăn qua Google API...`);

        let updated = 0;
        let notFound = 0;
        let failed = 0;

        // Lưu ý: Tài khoản miễn phí Google giới hạn 100 request/ngày.
        // Nếu có 226 món, script này có thể sẽ bị báo lỗi "Quota exceeded" sau 100 món đầu tiên.
        // Khi đó, chạy lại vào ngày hôm sau sẽ tự động tiếp tục cho các món còn lại (vì những món đã cập nhật sẽ không bị truy vấn lại).
        
        for (let i = 0; i < foodsWithoutImage.length; i++) {
            const food = foodsWithoutImage[i];
            process.stdout.write(`[${i+1}/${foodsWithoutImage.length}] Đang tìm ảnh cho "${food.name}"... `);
            
            const imageUrl = await searchGoogleImage(food.name);
            
            if (imageUrl) {
                await food.update({ imageUrl });
                console.log(`✅ Thành công`);
                updated++;
            } else {
                console.log(`❌ Không tìm thấy hoặc Lỗi API`);
                notFound++;
            }

            // Chờ 1 giây giữa các request để đảm bảo an toàn
            await sleep(1000);
        }

        console.log(`\n🎉  Hoàn tất! Đã cập nhật ảnh Google cho ${updated} món, thất bại/không tìm thấy ${notFound} món.`);
    } catch (err) {
        console.error('❌  Lỗi:', err.message);
    } finally {
        await sequelize.close();
        console.log('🔒  Đã đóng kết nối.');
    }
}

run();
