require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Food, sequelize } = require('../models');

async function dumpFoodsToJson() {
    try {
        console.log('Bắt đầu query dữ liệu từ database...');
        const foods = await Food.findAll({
            where: {
                isCustom: false,
                userId: null
            },
            raw: true
        });

        console.log(`Đã lấy ${foods.length} món ăn từ DB.`);

        // Lọc bỏ các trường kỹ thuật
        const cleanedFoods = foods.map(food => {
            const { id, createdAt, updatedAt, deletedAt, ...businessData } = food;
            return businessData;
        });

        // Đảm bảo thư mục data tồn tại
        const dataDir = path.join(__dirname, '../seeders/data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('Đã tạo thư mục seeders/data');
        }

        const outputPath = path.join(dataDir, 'foods_dump.json');
        
        // Ghi ra file JSON
        fs.writeFileSync(outputPath, JSON.stringify(cleanedFoods, null, 2), 'utf-8');
        console.log(`✅ Đã xuất dữ liệu ra file: ${outputPath}`);

        // Đóng kết nối DB trước khi thoát
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi dump dữ liệu:', error);
        process.exit(1);
    }
}

dumpFoodsToJson();
