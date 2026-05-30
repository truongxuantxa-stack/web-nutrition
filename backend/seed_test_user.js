require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Food, DiaryEntry, WeightLog, ExerciseLog, WaterLog, AdaptiveTDEELog } = require('./models');

async function seedUser() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Tạo User
        const hashedPassword = await bcrypt.hash('123456', 10);
        const email = `test45days_${Date.now()}@example.com`;
        const user = await User.create({
            fullName: 'Test User (Bad Diet)',
            email: email,
            password: hashedPassword,
            gender: 'male',
            birthDate: '1995-01-01',
            height: 170, // cm
            weight: 80, // kg (Overweight)
            activityLevel: 'sedentary',
            goal: 'lose_weight',
            isOnboarded: true,
            waterGoal: 2000,
            useAdaptiveTDEE: true,
        });

        console.log(`User created: ${email} / 123456 (id: ${user.id})`);

        // 2. Tạo một số Food rác để insert
        const badFood = await Food.create({
            userId: user.id,
            name: 'Thức ăn nhanh, Trà sữa & Snack',
            unit: '100g',
            calories: 350,  // high calorie
            protein: 5,     // low protein
            carbs: 40,      // high carbs
            fat: 20,        // high fat
            fiber: 1,       // low fiber
            sugar: 25,      // high sugar
            sodium: 800,    // high sodium
            isVerified: false,
        });

        const goodFood = await Food.create({
            userId: user.id,
            name: 'Cơm rau bình thường',
            unit: '100g',
            calories: 120,
            protein: 8,
            carbs: 20,
            fat: 3,
            fiber: 3,
            sugar: 2,
            sodium: 100,
            isVerified: false,
        });

        // Hàm helper để tạo DiaryEntry có đầy đủ snapshot
        const createEntry = async (date, food, mealType, amount) => {
            // giả sử amount là số gram, unit của food là 100g -> ratio = amount / 100
            const ratio = amount / 100;
            await DiaryEntry.create({
                userId: user.id,
                date: date,
                foodId: food.id,
                mealType: mealType,
                amount: amount,
                unit: 'g',
                caloriesSnapshot: food.calories * ratio,
                proteinSnapshot: food.protein * ratio,
                carbsSnapshot: food.carbs * ratio,
                fatSnapshot: food.fat * ratio,
                fiberSnapshot: food.fiber * ratio,
                sugarSnapshot: food.sugar * ratio,
                sodiumSnapshot: food.sodium * ratio
            });
        };

        // 3. Tạo dữ liệu 45 ngày qua
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 44); // 45 days including today

        let currentWeight = 80;

        for (let i = 0; i < 45; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            // --- A. NHẬT KÝ ĂN UỐNG ---
            // Ăn uống không lành mạnh, đa phần là bad food
            // Tạo lượng ăn ngẫu nhiên sao cho Calo vượt khoảng 110-130% TDEE tĩnh (khoảng 2200)
            // TDEE tĩnh của nam 170cm, 80kg, 29 tuổi = 1800 BMR * 1.2 = 2160
            // Ăn khoảng 2300 - 2800 calo.
            
            // 70% ngày ăn badFood (khoảng 500g = 1750 calo), 30% ngày có thêm goodFood
            const isVeryBadDay = Math.random() > 0.3;
            
            if (isVeryBadDay) {
                // Sáng
                await createEntry(dateStr, badFood, 'sang', 200);
                // Trưa
                await createEntry(dateStr, badFood, 'trua', 300);
                // Tối
                await createEntry(dateStr, badFood, 'toi', 300);
                // Tổng: 2800 calo. Đạm: 40g. Carbs: 320g. Fat: 160g. Fiber: 8g. Sugar: 200g. Sodium: 6400mg!
                // Cực kỳ thiếu lành mạnh
            } else {
                // Ngày ăn đỡ hơn tí
                await createEntry(dateStr, badFood, 'sang', 150);
                await createEntry(dateStr, goodFood, 'trua', 400);
                await createEntry(dateStr, badFood, 'toi', 200);
                // Tổng: 1705 calo. Đạm: ~40g.
            }

            // --- B. NƯỚC UỐNG ---
            // Uống rất ít nước, chỉ khoảng 500-1000ml (Mục tiêu 2000ml)
            const waterAmount = Math.floor(Math.random() * 500) + 500;
            await WaterLog.create({
                userId: user.id, date: dateStr, amount: waterAmount
            });

            // --- C. VẬN ĐỘNG ---
            // Gần như không vận động. Thỉnh thoảng (10%) đi bộ 100 calo
            if (Math.random() < 0.1) {
                await ExerciseLog.create({
                    userId: user.id, date: dateStr, sport: 'walking', duration: 20, caloriesBurned: 100
                });
            }

            // --- D. CÂN NẶNG ---
            // Ăn thặng dư calo thì cân nặng thực tế sẽ tăng dần.
            // Dao động lớn mỗi ngày do tích nước (ăn mặn).
            // Tích nước random từ -0.5 đến +1.5kg
            const waterRetention = (Math.random() * 2) - 0.5;
            
            // Tăng cân do mỡ: thừa 500 calo/ngày -> tăng khoảng 0.07kg/ngày
            if (isVeryBadDay) currentWeight += 0.05;
            else currentWeight -= 0.02;

            const loggedWeight = currentWeight + waterRetention;
            await WeightLog.create({
                userId: user.id, date: dateStr, weight: parseFloat(loggedWeight.toFixed(1))
            });
        }
        
        // Update current weight for user
        await user.update({ weight: parseFloat(currentWeight.toFixed(1)) });

        // Cần tính TDEE thích ứng. Ta có thể gọi hàm processWeeklyAdaptation cho từng tuần
        const { processWeeklyAdaptation } = require('./services/adaptiveTDEE.service');
        if (processWeeklyAdaptation) {
            console.log('Calculating Adaptive TDEE history...');
            for (let w = 6; w >= 1; w--) {
                const wStart = new Date(endDate);
                wStart.setDate(wStart.getDate() - w * 7 - wStart.getDay() + 1); // Monday
                const wEnd = new Date(wStart);
                wEnd.setDate(wStart.getDate() + 6); // Sunday
                
                await processWeeklyAdaptation(user.id, wStart.toISOString().split('T')[0], wEnd.toISOString().split('T')[0]);
            }
        } else {
            console.log('TDEE service not found, skipped adaptive TDEE calculation');
        }

        console.log('Done generating 45 days of data!');
        console.log(`\n=> Vui lòng đăng nhập với email: ${email} | Mật khẩu: 123456`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedUser();
