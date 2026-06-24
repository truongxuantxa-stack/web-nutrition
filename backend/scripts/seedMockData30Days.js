'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
    sequelize,
    User,
    Food,
    DiaryEntry,
    WeightLog,
    ExerciseLog,
    WaterLog
} = require('../models');

async function seed() {
    try {
        console.log('=== BẮT ĐẦU SEED MOCK DATA 30 NGÀY CHO KHANH@GMAIL.COM ===');

        // 1. Tìm hoặc tạo user Khanh@gmail.com
        let user = await User.findOne({ where: { email: 'Khanh@gmail.com' } });
        if (!user) {
            console.log('User Khanh@gmail.com chưa tồn tại, tiến hành tạo mới...');
            const hashedPassword = await bcrypt.hash('123456', 10);
            user = await User.create({
                fullName: 'Nguyễn Văn Khánh',
                email: 'Khanh@gmail.com',
                password: hashedPassword,
                gender: 'male',
                birthDate: '1998-05-19',
                height: 175,
                weight: 75,
                activityLevel: 'moderate',
                goal: 'lose_weight',
                isOnboarded: true,
                waterGoal: 2600
            });
            console.log(`Đã tạo thành công User với ID: ${user.id}`);
        } else {
            console.log(`Đã tìm thấy User Khanh@gmail.com với ID: ${user.id}`);
            // Cập nhật thông tin cơ bản cho đồng bộ
            await user.update({
                gender: 'male',
                height: 175,
                weight: 75,
                isOnboarded: true,
                waterGoal: 2600
            });
        }

        const userId = user.id;

        // 2. Xóa các bản ghi cũ của user này để làm mới hoàn toàn
        console.log('Đang xóa sạch dữ liệu nhật ký cũ để tránh trùng lặp...');
        await DiaryEntry.destroy({ where: { userId } });
        await WeightLog.destroy({ where: { userId } });
        await ExerciseLog.destroy({ where: { userId } });
        await WaterLog.destroy({ where: { userId } });
        console.log('Đã dọn dẹp xong dữ liệu nhật ký cũ.');

        // 3. Lấy danh sách thực phẩm trong Database
        const allFoods = await Food.findAll();
        if (allFoods.length === 0) {
            throw new Error('Database chưa có thực phẩm! Vui lòng chạy seeder thực phẩm trước.');
        }
        console.log(`Đã lấy thành công ${allFoods.length} thực phẩm từ DB.`);

        // Phân loại thực phẩm theo bữa
        const filterByCategory = (categories) => allFoods.filter(f => categories.includes(f.category));
        
        const breakfastFoods = allFoods.filter(f => 
            f.category === 'com' || f.category === 'pho_bun' || f.category === 'banh' || f.category === 'do_uong' ||
            f.name.toLowerCase().includes('bánh') || f.name.toLowerCase().includes('phở') || f.name.toLowerCase().includes('sữa')
        );
        
        const mainFoods = allFoods.filter(f => 
            f.category === 'com' || f.category === 'thit_ca' || f.category === 'rau_cu' || f.category === 'pho_bun'
        );

        const snackFoods = allFoods.filter(f => 
            f.category === 'trai_cay' || f.category === 'banh' || f.category === 'do_uong'
        );

        // Fallback phòng trường hợp filter trống
        const getBfFood = () => breakfastFoods.length > 0 ? breakfastFoods[Math.floor(Math.random() * breakfastFoods.length)] : allFoods[Math.floor(Math.random() * allFoods.length)];
        const getMainFood = () => mainFoods.length > 0 ? mainFoods[Math.floor(Math.random() * mainFoods.length)] : allFoods[Math.floor(Math.random() * allFoods.length)];
        const getSnackFood = () => snackFoods.length > 0 ? snackFoods[Math.floor(Math.random() * snackFoods.length)] : allFoods[Math.floor(Math.random() * allFoods.length)];

        // Danh sách các môn thể thao
        const sports = [
            { key: 'running', label: 'Chạy bộ', met: 8 },
            { key: 'badminton', label: 'Cầu lông', met: 5.5 },
            { key: 'cycling', label: 'Đạp xe', met: 6 },
            { key: 'swimming', label: 'Bơi lội', met: 7 }
        ];

        // 4. Tạo dữ liệu cho 30 ngày qua (từ hôm nay - 29 ngày đến hôm nay)
        console.log('Tiến hành tạo dữ liệu nhật ký cho 30 ngày qua...');

        const diaryEntriesToCreate = [];
        const weightLogsToCreate = [];
        const waterLogsToCreate = [];
        const exerciseLogsToCreate = [];

        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() - i);
            const dateStr = currentDate.toISOString().split('T')[0];

            // A. CÂN NẶNG: Giảm dần từ 75kg về khoảng ~72.5kg sau 30 ngày
            const progressRatio = (29 - i) / 29; // 0 đến 1
            const baseWeight = 75 - (progressRatio * 2.5); // Giảm 2.5kg tuyến tính
            const dailyWeight = baseWeight + (Math.random() * 0.4 - 0.2); // Dao động ngẫu nhiên ±0.2kg
            weightLogsToCreate.push({
                userId,
                weight: Math.round(dailyWeight * 10) / 10,
                date: dateStr,
                note: i === 29 ? 'Bắt đầu hành trình giảm cân' : (i === 0 ? 'Cân nặng ngày hôm nay' : null)
            });

            // B. NƯỚC UỐNG: Đều đặn mỗi ngày uống khoảng 2000 - 2800 ml
            const morningWater = 500 + Math.floor(Math.random() * 3) * 100; // 500ml - 700ml
            const afternoonWater = 500 + Math.floor(Math.random() * 3) * 100; // 500ml - 700ml
            const eveningWater = 1000 + Math.floor(Math.random() * 5) * 100; // 1000ml - 1400ml
            
            waterLogsToCreate.push(
                { userId, amount: morningWater, date: dateStr, note: 'Sáng ngủ dậy' },
                { userId, amount: afternoonWater, date: dateStr, note: 'Chiều' },
                { userId, amount: eveningWater, date: dateStr, note: 'Tối trước khi ngủ' }
            );

            // C. LUYỆN TẬP: Tập thể dục khoảng 4 lần một tuần (nếu ngày i chia hết cho 2 hoặc 3)
            if (i % 2 === 0 || i % 7 === 1) {
                const sport = sports[Math.floor(Math.random() * sports.length)];
                const duration = 30 + Math.floor(Math.random() * 5) * 10; // 30 - 70 phút
                // Công thức tính calo tiêu thụ: MET * weight * (duration / 60)
                const burned = Math.round(sport.met * dailyWeight * (duration / 60));
                exerciseLogsToCreate.push({
                    userId,
                    sport: sport.key,
                    duration,
                    caloriesBurned: burned,
                    date: dateStr
                });
            }

            // D. NHẬT KÝ ĂN UỐNG (Thực đơn hàng ngày)
            // Thiết lập mục tiêu calo giảm cân của user này là khoảng ~1750 kcal
            // Chúng ta sẽ add thức ăn sao cho tổng Calo nạp vào dao động khoảng 1550 - 1950 kcal để đạt tỉ lệ tuân thủ tốt.

            // --- Bữa sáng ---
            const bfFood = getBfFood();
            const bfAmount = 1 + Math.floor(Math.random() * 2) * 0.5; // 1.0 hoặc 1.5 phần
            addDiaryEntry('sang', bfFood, bfAmount, dateStr);

            // --- Bữa trưa ---
            const lunchMain = getMainFood();
            const lunchSide = getMainFood();
            addDiaryEntry('trua', lunchMain, 1.2, dateStr);
            addDiaryEntry('trua', lunchSide, 1.0, dateStr);

            // --- Bữa tối ---
            const dinnerMain = getMainFood();
            const dinnerVeg = allFoods.find(f => f.category === 'rau_cu') || getMainFood();
            addDiaryEntry('toi', dinnerMain, 1.0, dateStr);
            addDiaryEntry('toi', dinnerVeg, 1.5, dateStr);

            // --- Bữa phụ ---
            if (Math.random() > 0.3) { // 70% số ngày có ăn vặt trái cây / sữa chua
                const snack = getSnackFood();
                addDiaryEntry('phu', snack, 1.0, dateStr);
            }
        }

        function addDiaryEntry(mealType, food, amount, date) {
            diaryEntriesToCreate.push({
                userId,
                foodId: food.id,
                amount,
                mealType,
                date,
                caloriesSnapshot: Math.round(food.calories * amount * 10) / 10,
                proteinSnapshot: Math.round(food.protein * amount * 10) / 10,
                carbsSnapshot: Math.round(food.carbs * amount * 10) / 10,
                fatSnapshot: Math.round(food.fat * amount * 10) / 10,
                fiberSnapshot: food.fiber ? Math.round(food.fiber * amount * 10) / 10 : 0,
                sugarSnapshot: food.sugar ? Math.round(food.sugar * amount * 10) / 10 : 0,
                sodiumSnapshot: food.sodium ? Math.round(food.sodium * amount * 10) / 10 : 0,
                note: 'Seed tự động'
            });
        }

        // 5. Lưu vào Database
        console.log(`Đang bulkCreate ${weightLogsToCreate.length} WeightLogs...`);
        await WeightLog.bulkCreate(weightLogsToCreate);

        console.log(`Đang bulkCreate ${waterLogsToCreate.length} WaterLogs...`);
        await WaterLog.bulkCreate(waterLogsToCreate);

        console.log(`Đang bulkCreate ${exerciseLogsToCreate.length} ExerciseLogs...`);
        await ExerciseLog.bulkCreate(exerciseLogsToCreate);

        console.log(`Đang bulkCreate ${diaryEntriesToCreate.length} DiaryEntries...`);
        await DiaryEntry.bulkCreate(diaryEntriesToCreate);

        console.log('=== SEED MOCK DATA THÀNH CÔNG RỰC RỠ! ===');
        console.log(`-> Đã tạo tài khoản: Khanh@gmail.com (Mật khẩu: 123456)`);
        console.log(`-> Dữ liệu bao trùm: 30 ngày (Đầy đủ Cân nặng, Nước uống, Tập luyện, Nhật ký ăn uống)`);
        
    } catch (error) {
        console.error('Lỗi trong quá trình seed mock data:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

// Chi chay khi file duoc goi TRUC TIEP (node backend\scripts\seedMockData30Days.js)
// Tranh tu dong thuc thi khi bi require() boi file khac -> Ngan xoa DB nham!
if (require.main === module) {
    seed();
}