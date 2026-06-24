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
    WaterLog,
    AdaptiveTDEELog
} = require('../models');
const { processWeeklyAdaptation } = require('../services/adaptiveTDEE.service');

async function seed() {
    try {
        console.log('=== BẮT ĐẦU SEED MOCK DATA CHIẾN LƯỢC ===');

        const daysInPast = 30;
        const daysInFuture = 60;
        const totalDays = daysInPast + daysInFuture;
        
        console.log(`Cấu hình: Seed từ ${daysInPast} ngày trước đến ${daysInFuture} ngày trong tương lai (Tổng: ${totalDays} ngày)`);

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
                goalWeight: 70,
                activityLevel: 'moderate',
                goal: 'lose_weight',
                isOnboarded: true,
                waterGoal: 2600,
                useAdaptiveTDEE: true
            });
            console.log(`Đã tạo thành công User với ID: ${user.id}`);
        } else {
            console.log(`Đã tìm thấy User Khanh@gmail.com với ID: ${user.id}`);
            await user.update({
                gender: 'male',
                height: 175,
                weight: 75,
                goalWeight: 70,
                isOnboarded: true,
                waterGoal: 2600,
                useAdaptiveTDEE: true,
                adaptiveTDEE: null // reset to recalculate
            });
        }

        const userId = user.id;

        // 2. Xóa các bản ghi cũ
        console.log('Đang xóa sạch dữ liệu nhật ký cũ để tránh trùng lặp...');
        await DiaryEntry.destroy({ where: { userId } });
        await WeightLog.destroy({ where: { userId } });
        await ExerciseLog.destroy({ where: { userId } });
        await WaterLog.destroy({ where: { userId } });
        await AdaptiveTDEELog.destroy({ where: { userId } });
        console.log('Đã dọn dẹp xong dữ liệu nhật ký cũ.');

        // 3. Lấy danh sách thực phẩm
        const allFoods = await Food.findAll();
        if (allFoods.length === 0) {
            throw new Error('Database chưa có thực phẩm! Vui lòng chạy seeder thực phẩm trước.');
        }

        // Cache lookup để search nhanh
        const foodCache = {};
        allFoods.forEach(f => foodCache[f.name] = f);

        // Helper fallback
        const getFood = (name, fallbackCategory) => {
            if (foodCache[name]) return foodCache[name];
            const fallbacks = allFoods.filter(f => f.category === fallbackCategory);
            return fallbacks.length > 0 ? fallbacks[Math.floor(Math.random() * fallbacks.length)] : allFoods[0];
        };
        const getRandomFoodByCategory = (category) => {
            const arr = allFoods.filter(f => f.category === category);
            return arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : allFoods[0];
        }

        const PINNED_SNAPSHOTS = {
            'Trà Sữa Trân Châu': { calories: 350, sodium: 80, sugar: 50, fiber: 0 },
            'Bánh Mì Pate Xá Xíu': { calories: 450, sodium: 850, sugar: 4, fiber: 1.5 },
            'Mì Tôm Trứng': { calories: 450, sodium: 1500, sugar: 2, fiber: 1 },
            'Nước Mía': { calories: 73, sodium: 5, sugar: 18, fiber: 0 },
            'Salad Trứng Luộc Rau Mầm': { calories: 220, sodium: 180, sugar: 1, fiber: 3.5 },
            'Yến Mạch Trái Cây Hạt': { calories: 350, sodium: 10, sugar: 12, fiber: 6 },
            'Cháo Yến Mạch Sữa Tươi': { calories: 280, sodium: 50, sugar: 5, fiber: 4 },
            'Ức Gà Áp Chảo Sốt Chanh Dây': { calories: 220, sodium: 280, sugar: 3, fiber: 0.5 },
            'Cá Diêu Hồng Hấp Hành': { calories: 150, sodium: 350, sugar: 0, fiber: 0 },
            'Gà Luộc Lá Chanh': { calories: 200, sodium: 60, sugar: 0, fiber: 0 },
            'Cà Phê Đen Không Đường': { calories: 5, sodium: 5, sugar: 0, fiber: 0 },
            'Trà Đá': { calories: 2, sodium: 1, sugar: 0, fiber: 0 },
            'Trà Xanh Không Đường': { calories: 2, sodium: 0, sugar: 0, fiber: 0 },
            'Dưa hấu': { sugar: 6 },
            'Chuối': { sugar: 12 },
            'Táo đỏ': { sugar: 10 }
        };

        const diaryEntriesToCreate = [];
        const weightLogsToCreate = [];
        const waterLogsToCreate = [];
        const exerciseLogsToCreate = [];

        const today = new Date();
        const startOfSeed = new Date(today);
        startOfSeed.setDate(today.getDate() - daysInPast);

        console.log(`Tiến hành tạo dữ liệu cho ${totalDays} ngày...`);
        for (let i = -daysInPast; i <= daysInFuture; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayOfWeek = currentDate.getDay(); // 0 = CN, 1 = T2...

            let phase = 3;
            if (i < -10) phase = 1;
            else if (i <= 0) phase = 2;

            // --- WEIGHT LOG ---
            let dailyWeight = 70;
            if (phase === 1) { // -30 to -11
                const progress = (i + 30) / 20; // 0 to 1
                dailyWeight = 75.0 - (progress * 1.5); // 75 -> 73.5
            } else if (phase === 2) { // -10 to 0
                const progress = (i + 10) / 10;
                dailyWeight = 73.5 - (progress * 1.0); // 73.5 -> 72.5
            } else { // 1 to 60
                const progress = (i) / 60;
                dailyWeight = 72.5 - (progress * 2.5); // 72.5 -> 70.0
            }
            dailyWeight += (Math.random() * 0.4 - 0.2);

            let note = null;
            if (i === -daysInPast) note = 'Bắt đầu hành trình giảm cân';
            else if (i === 0) note = 'Ngày hiện tại';
            else if (i === daysInFuture) note = 'Ngày bảo vệ đồ án dự kiến';

            weightLogsToCreate.push({
                userId,
                weight: Math.round(dailyWeight * 10) / 10,
                date: dateStr,
                note
            });

            // --- WATER LOG ---
            let totalWater = 0;
            if (phase === 1) totalWater = 1500 + Math.random() * 500;
            else if (phase === 2) totalWater = 2000 + Math.random() * 400;
            else if (phase === 3) totalWater = 2400 + Math.random() * 400;

            const wMorning = Math.round(totalWater * 0.3);
            const wAfternoon = Math.round(totalWater * 0.4);
            const wEvening = Math.round(totalWater * 0.3);

            waterLogsToCreate.push(
                { userId, amount: wMorning, date: dateStr, note: 'Sáng' },
                { userId, amount: wAfternoon, date: dateStr, note: 'Chiều' },
                { userId, amount: wEvening, date: dateStr, note: 'Tối' }
            );

            // --- EXERCISE LOG ---
            const exProb = phase === 1 ? (3/7) : phase === 2 ? (4/7) : (5/7);
            if (Math.random() < exProb) {
                let sports = ['running', 'cycling'];
                let duration = 30 + Math.random() * 10;
                if (phase === 2) { sports.push('badminton', 'swimming'); duration = 30 + Math.random() * 20; }
                if (phase === 3) { sports.push('badminton', 'swimming'); duration = 40 + Math.random() * 20; }
                
                const sport = sports[Math.floor(Math.random() * sports.length)];
                let met = 7;
                if (sport === 'running') met = 8;
                if (sport === 'badminton') met = 5.5;
                if (sport === 'cycling') met = 6;
                if (sport === 'swimming') met = 7;

                const burned = Math.round(met * dailyWeight * (duration / 60));
                exerciseLogsToCreate.push({
                    userId, sport, duration: Math.round(duration), caloriesBurned: burned, date: dateStr
                });
            }

            // --- DIARY ENTRY ---
            const addDiaryEntry = (mealType, food, amount) => {
                if (!food) return;
                const override = PINNED_SNAPSHOTS[food.name] || {};
                
                const getVal = (overrideVal, foodVal) => {
                    if (overrideVal !== undefined) return Math.round(overrideVal * amount * 10) / 10;
                    return foodVal ? Math.round(foodVal * amount * 10) / 10 : 0;
                }

                diaryEntriesToCreate.push({
                    userId, foodId: food.id, amount, mealType, date: dateStr,
                    caloriesSnapshot: getVal(override.calories, food.calories),
                    proteinSnapshot: getVal(override.protein, food.protein),
                    carbsSnapshot: getVal(override.carbs, food.carbs),
                    fatSnapshot: getVal(override.fat, food.fat),
                    fiberSnapshot: getVal(override.fiber, food.fiber),
                    sugarSnapshot: getVal(override.sugar, food.sugar),
                    sodiumSnapshot: getVal(override.sodium, food.sodium),
                    vitaminASnapshot: getVal(override.vitaminA, food.vitaminA),
                    vitaminCSnapshot: getVal(override.vitaminC, food.vitaminC),
                    calciumSnapshot: getVal(override.calcium, food.calcium),
                    ironSnapshot: getVal(override.iron, food.iron),
                    note: 'Seed chiến lược'
                });
            };

            const isT246 = [1, 3, 5].includes(dayOfWeek);
            const isT35 = [2, 4].includes(dayOfWeek);
            const isT357CN = [2, 4, 6, 0].includes(dayOfWeek);
            const isT7CN = [6, 0].includes(dayOfWeek);

            // Phase 1
            if (phase === 1) {
                if (isT246) addDiaryEntry('sang', getFood('Mì Tôm Trứng', 'pho_bun'), 1);
                else if (isT357CN) addDiaryEntry('sang', getFood('Bánh Mì Pate Xá Xíu', 'banh'), 1);

                addDiaryEntry('trua', getRandomFoodByCategory('com'), 1);
                addDiaryEntry('toi', getRandomFoodByCategory('com'), 1);
                addDiaryEntry('toi', getRandomFoodByCategory('rau_cu'), 1);

                if (isT35) addDiaryEntry('phu', getFood('Trà Sữa Trân Châu', 'do_uong'), 1);
                if (isT246) addDiaryEntry('phu', getFood('Nước Mía', 'do_uong'), 1);
            }
            // Phase 2
            else if (phase === 2) {
                if (isT246) addDiaryEntry('sang', getFood('Cháo Yến Mạch Sữa Tươi', 'com'), 1);
                else if (isT357CN) addDiaryEntry('sang', getFood('Bánh Mì Trứng Ốp La', 'banh'), 1);

                addDiaryEntry('trua', getRandomFoodByCategory('com'), 1);
                addDiaryEntry('toi', getRandomFoodByCategory('com'), 1);
                addDiaryEntry('toi', getRandomFoodByCategory('rau_cu'), 1);

                if (isT35) addDiaryEntry('phu', getFood('Trà Sữa Trân Châu', 'do_uong'), 1);
                if (isT246) addDiaryEntry('phu', getFood(Math.random() > 0.5 ? 'Dưa hấu' : 'Chuối', 'trai_cay'), 1);
            }
            // Phase 3
            else if (phase === 3) {
                if (isT246) addDiaryEntry('sang', getFood('Salad Trứng Luộc Rau Mầm', 'rau_cu'), 1);
                else if (isT35) addDiaryEntry('sang', getFood('Yến Mạch Trái Cây Hạt', 'banh'), 1);
                else if (isT7CN) addDiaryEntry('sang', getFood('Cháo Gà Gạo Lứt', 'com'), 1);

                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    addDiaryEntry('trua', getFood('Ức Gà Áp Chảo Sốt Chanh Dây', 'thit_ca'), 1);
                    addDiaryEntry('trua', getRandomFoodByCategory('rau_cu'), 1);
                } else {
                    addDiaryEntry('trua', getRandomFoodByCategory('com'), 1);
                    addDiaryEntry('trua', getRandomFoodByCategory('rau_cu'), 1);
                }

                addDiaryEntry('toi', getFood(Math.random() > 0.5 ? 'Cá Diêu Hồng Hấp Hành' : 'Gà Luộc Lá Chanh', 'thit_ca'), 1);
                addDiaryEntry('toi', getRandomFoodByCategory('rau_cu'), 1);

                if (isT246) {
                    const r = Math.random();
                    let f = 'Dưa hấu';
                    if (r > 0.66) f = 'Chuối';
                    else if (r > 0.33) f = 'Táo đỏ';
                    addDiaryEntry('phu', getFood(f, 'trai_cay'), 1);
                }
                if (isT35) addDiaryEntry('phu', getFood(Math.random() > 0.5 ? 'Trà Đá' : 'Cà Phê Đen Không Đường', 'do_uong'), 1);
                if (dayOfWeek === 6) addDiaryEntry('phu', getFood('Trà Xanh Không Đường', 'do_uong'), 1);
            }
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

        // 6. Tính Adaptive TDEE cho 13 tuần
        console.log('\n--- TÍNH TOÁN ADAPTIVE TDEE (Vòng lặp 13 tuần) ---');
        const seedStart = new Date(startOfSeed);
        const startDayOfWeek = seedStart.getDay();
        const mondayOffset = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
        seedStart.setDate(seedStart.getDate() + mondayOffset);

        for (let week = 0; week < 13; week++) {
            const weekStart = new Date(seedStart);
            weekStart.setDate(seedStart.getDate() + week * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            if (weekEnd > today) {
                console.log(`Bỏ qua tuần tương lai: ${weekStart.toISOString().split('T')[0]} -> ${weekEnd.toISOString().split('T')[0]}`);
                break;
            }
            
            const ws = weekStart.toISOString().split('T')[0];
            const we = weekEnd.toISOString().split('T')[0];
            
            console.log(`Tuần ${week + 1}: ${ws} → ${we}`);
            await processWeeklyAdaptation(userId, ws, we);
        }

        console.log('\n=== SEED MOCK DATA CHIẾN LƯỢC THÀNH CÔNG RỰC RỠ! ===');
        console.log(`-> Đã tạo tài khoản: Khanh@gmail.com`);
        console.log(`-> Dữ liệu bao trùm: ${totalDays} ngày (Từ -${daysInPast} ngày đến +${daysInFuture} ngày tới)`);
        
    } catch (error) {
        console.error('Lỗi trong quá trình seed mock data:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

seed();
