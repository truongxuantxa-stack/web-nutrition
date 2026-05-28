'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize, Food } = require('../models');
const https = require('https');
const http = require('http');
const url = require('url');

// Concurrency limit cho việc kiểm tra URL
const CONCURRENCY_LIMIT = 15;

// Hàm kiểm tra xem URL ảnh có tải được không (trả về status code)
function checkUrl(imageUrl) {
    return new Promise((resolve) => {
        if (!imageUrl) {
            return resolve({ ok: false, status: null, error: 'Không có URL' });
        }

        const parsedUrl = url.parse(imageUrl);
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        const options = {
            method: 'GET', // Một số server chặn HEAD request, dùng GET + abort là an toàn nhất
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': 'https://www.google.com/'
            },
            timeout: 3000 // Giới hạn 3 giây
        };

        const req = protocol.request(imageUrl, options, (res) => {
            const status = res.statusCode;
            res.resume(); // Đọc hết stream để giải phóng socket
            
            if (status >= 200 && status < 300) {
                resolve({ ok: true, status });
            } else {
                resolve({ ok: false, status, error: `HTTP ${status}` });
            }
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ ok: false, status: null, error: 'Timeout 3s' });
        });

        req.on('error', (err) => {
            resolve({ ok: false, status: null, error: err.message });
        });

        req.end();
    });
}

// Hàm cào ảnh từ Bing Images (trả về 1 ảnh tốt)
function searchBingImage(query, foodType) {
    return new Promise((resolve) => {
        const cleanName = query.replace(/\s*\(.*?\)\s*/g, '').trim();
        let searchQuery = cleanName;
        if (foodType === 'raw') {
            searchQuery = `${cleanName} nguyên liệu tươi sống chưa chế biến`;
        } else {
            searchQuery = `${cleanName} món ăn ngon đẹp mắt`;
        }
        
        const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}&form=HDRSC2`;
        
        https.get(bingUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Lấy ra tất cả các url kết quả
                const matches = [...data.matchAll(/murl&quot;:&quot;(.*?)&quot;/g)];
                const urls = matches.map(m => m[1]).slice(0, 10);
                resolve(urls);
            });
        }).on('error', () => resolve([]));
    });
}

// Phân tích từ khóa để phát hiện ảnh sai ngữ cảnh (raw vs cooked)
const COOKED_KEYWORDS = [
    'nướng', 'chiên', 'xào', 'nấu', 'kho', 'luộc', 'lẩu', 'gỏi', 'nộm', 'sốt', 'bát', 'tô', 
    'dĩa', 'đĩa', 'chín', 'hấp', 'rang', 'cuộn', 'khô', 'kho', 'canh', 'súp', 'soup', 'salad', 
    'fried', 'cooked', 'baked', 'roasted', 'grilled', 'steamed', 'stewed', 'sauteed', 
    'recipe', 'mon-an', 'cach-lam', 'nau-an', 'dich-vu', 'am-thuc'
];

function isSuspectedCookedUrl(imageUrl, foodType, foodName) {
    if (!imageUrl || foodType !== 'raw') return false;
    
    // Tên món ăn có từ khóa thô thì mới check
    const lowerName = foodName.toLowerCase();
    const isRawConcept = lowerName.includes('thô') || lowerName.includes('tươi') || lowerName.includes('sống') || 
                         ['protein', 'carb', 'fat', 'fiber'].includes(foodType);
    
    if (isRawConcept) {
        const lowerUrl = imageUrl.toLowerCase();
        for (const kw of COOKED_KEYWORDS) {
            if (lowerUrl.includes(kw)) {
                return true;
            }
        }
    }
    return false;
}

// Chia mảng thành các chunks để chạy concurrency
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

async function run() {
    const writeMode = process.argv.includes('--write');
    console.log(`🚀 Bắt đầu quét và kiểm tra hình ảnh thực phẩm trong Database... (Write mode: ${writeMode})`);
    
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối database thành công.');

        // Lấy tất cả thực phẩm hệ thống
        const foods = await Food.findAll({
            where: { isCustom: false },
            attributes: ['id', 'name', 'foodType', 'category', 'imageUrl']
        });

        console.log(`Tổng số thực phẩm hệ thống cần quét: ${foods.length} món.`);
        
        const chunks = chunkArray(foods, CONCURRENCY_LIMIT);
        const report = [];
        let checkedCount = 0;
        let errorCount = 0;
        let contextIssueCount = 0;
        let successUpdateCount = 0;

        for (let idx = 0; idx < chunks.length; idx++) {
            const chunk = chunks[idx];
            console.log(`[Batch ${idx + 1}/${chunks.length}] Đang kiểm tra ${chunk.length} món...`);
            
            const promises = chunk.map(async (food) => {
                checkedCount++;
                if (!food.imageUrl) {
                    return {
                        id: food.id,
                        name: food.name,
                        foodType: food.foodType,
                        imageUrl: null,
                        status: 'MISSING',
                        error: 'Không có hình ảnh',
                        action: 'Cần tìm ảnh mới'
                    };
                }

                // 1. Kiểm tra URL hoạt động
                const checkRes = await checkUrl(food.imageUrl);
                
                // 2. Kiểm tra ngữ cảnh ảnh (thô vs chín)
                const contextIssue = isSuspectedCookedUrl(food.imageUrl, food.foodType, food.name);

                let status = 'OK';
                let errorMsg = '';
                
                if (!checkRes.ok) {
                    status = 'BROKEN_LINK';
                    errorMsg = checkRes.error;
                    errorCount++;
                } else if (contextIssue) {
                    status = 'SUSPECTED_CONTEXT';
                    errorMsg = 'Nghi ngờ ảnh món chín cho nguyên liệu thô';
                    contextIssueCount++;
                }

                if (status !== 'OK') {
                    // Cố gắng tìm kiếm ảnh thay thế từ Bing Images và chọn ảnh hoạt động
                    const candidateUrls = await searchBingImage(food.name, food.foodType);
                    let replacementUrl = null;
                    
                    // Thử tìm ảnh hoạt động trong 5 ứng cử viên đầu tiên
                    for (const candidate of candidateUrls.slice(0, 5)) {
                        const candCheck = await checkUrl(candidate);
                        if (candCheck.ok) {
                            replacementUrl = candidate;
                            break;
                        }
                    }

                    let actionTaken = 'Báo cáo sai sót';
                    if (replacementUrl) {
                        if (writeMode) {
                            // Cập nhật vào DB
                            const foodInDb = await Food.findByPk(food.id);
                            if (foodInDb) {
                                await foodInDb.update({ imageUrl: replacementUrl });
                                successUpdateCount++;
                                actionTaken = 'Đã tự động cập nhật ảnh mới hoạt động';
                            }
                        } else {
                            actionTaken = 'Đã tìm thấy ảnh thay thế (chưa lưu)';
                        }
                    } else {
                        actionTaken = 'Không tìm thấy ảnh thay thế khả dụng';
                    }

                    return {
                        id: food.id,
                        name: food.name,
                        foodType: food.foodType,
                        imageUrl: food.imageUrl,
                        status,
                        error: errorMsg,
                        replacementUrl,
                        action: actionTaken
                    };
                }

                return null;
            });

            const results = await Promise.all(promises);
            results.forEach(r => {
                if (r) report.push(r);
            });

            // Chờ 300ms giữa các batch để tránh bị rate limit
            await new Promise(r => setTimeout(r, 300));
        }

        // Tạo nội dung Markdown Báo cáo
        const fs = require('fs');
        const path = require('path');
        
        let md = `# BÁO CÁO KIỂM TRA HÌNH ẢNH THỰC PHẨM (IMAGE AUDIT REPORT)\n\n`;
        md += `* **Thời gian thực hiện:** ${new Date().toLocaleString('vi-VN')}\n`;
        md += `* **Tổng số thực phẩm quét:** ${checkedCount} món\n`;
        md += `* **Số ảnh bị lỗi kết nối / Chặn hotlink:** ${errorCount} món\n`;
        md += `* **Số ảnh nghi ngờ sai ngữ cảnh (Thô vs Chín):** ${contextIssueCount} món\n`;
        md += `* **Trạng thái cập nhật tự động:** ${writeMode ? `Đã cập nhật ${successUpdateCount} ảnh mới` : 'Chỉ báo cáo (chưa cập nhật)'}\n\n`;
        
        md += `## Danh sách chi tiết thực phẩm có hình ảnh sai/lỗi\n\n`;
        md += `| ID | Tên món ăn | Phân loại | URL hiện tại | Vấn đề phát hiện | URL đề xuất / Thay thế | Trạng thái xử lý |\n`;
        md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

        report.forEach(r => {
            const displayUrl = r.imageUrl ? (r.imageUrl.length > 50 ? `${r.imageUrl.substring(0, 47)}...` : r.imageUrl) : 'Không có';
            const displayRepl = r.replacementUrl ? (r.replacementUrl.length > 50 ? `${r.replacementUrl.substring(0, 47)}...` : r.replacementUrl) : 'Không có';
            
            md += `| ${r.id} | **${r.name}** | \`${r.foodType}\` | [Xem](${r.imageUrl || ''}) <br> \`${displayUrl}\` | \`${r.status}\`<br>${r.error} | ${r.replacementUrl ? `[Xem](${r.replacementUrl}) <br> \`${displayRepl}\`` : 'Không có'} | **${r.action}** |\n`;
        });

        const reportPath = 'C:\\Users\\Hi Windows 10\\.gemini\\antigravity-ide\\brain\\82ea5100-90a3-40e0-b606-30d61faaf5cf/food_images_audit_report.md';
        fs.writeFileSync(reportPath, md, 'utf-8');
        console.log(`\n🎉 Quét thành công! Đã ghi báo cáo chi tiết vào: ${reportPath}`);

    } catch (err) {
        console.error('❌ Lỗi hệ thống:', err.message);
    } finally {
        await sequelize.close();
        console.log('🔒 Đã đóng kết nối.');
    }
}

run();
