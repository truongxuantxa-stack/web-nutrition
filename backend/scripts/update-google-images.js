'use strict';
/**
 * Cập nhật imageUrl cho các thực phẩm chế biến (dish) chưa có ảnh bằng Google Custom Search API.
 * Chạy: node scripts/update-google-images.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const https = require('https');
const { sequelize, Food } = require('../models');

const apiKeys = process.env.GOOGLE_API_KEY 
    ? process.env.GOOGLE_API_KEY.split(',').map(k => k.trim()).filter(k => k) 
    : [];
let currentKeyIndex = 0;

const GOOGLE_CX = process.env.GOOGLE_CX;

if (apiKeys.length === 0 || !GOOGLE_CX) {
    console.error('❌ Lỗi: Cần cung cấp ít nhất 1 GOOGLE_API_KEY và GOOGLE_CX trong file .env');
    process.exit(1);
}

const getApiKey = () => apiKeys[currentKeyIndex];

// Hàm helper gọi Google Custom Search API hỗ trợ tự động đổi key
const searchGoogleImage = async (query) => {
    let attempts = 0;
    const maxAttempts = Math.max(1, apiKeys.length);
    
    while (attempts < maxAttempts) {
        const currentKey = getApiKey();
        const searchQuery = `${query} món ăn`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${currentKey}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}&searchType=image&imgSize=large&num=1`;
        
        try {
            const result = await new Promise((resolve, reject) => {
                https.get(url, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            if (json.error) {
                                // Nếu là lỗi quota (429 Too Many Requests hoặc quota exceeded)
                                if (json.error.code === 429 || json.error.message.toLowerCase().includes('quota')) {
                                    reject(new Error('QUOTA_EXCEEDED'));
                                } else {
                                    console.error('\nLỗi API:', json.error.message);
                                    resolve(null);
                                }
                            } else if (json.items && json.items.length > 0) {
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
                    console.error('Lỗi network khi gọi Google API:', err.message);
                    resolve(null);
                });
            });
            return result; 
        } catch (err) {
            if (err.message === 'QUOTA_EXCEEDED') {
                console.log(`\n⚠️ API Key index ${currentKeyIndex} đã hết Quota. ${attempts + 1 < apiKeys.length ? 'Chuyển sang key tiếp theo...' : 'Đã thử hết tất cả các key.'}`);
                currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
                attempts++;
                if (attempts >= maxAttempts) {
                    console.error('\n❌ Tất cả API keys đều đã hết Quota Google Custom Search.');
                    return null;
                }
                // Thử lại vòng lặp với key mới
            } else {
                return null;
            }
        }
    }
    return null;
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
