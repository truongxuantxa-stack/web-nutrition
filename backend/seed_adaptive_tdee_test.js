require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Food, DiaryEntry, WeightLog, WaterLog } = require('./models');
const { processWeeklyAdaptation } = require('./services/adaptiveTDEE.service');

async function seedAdaptiveTDEE() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const targetEmail = 'Vankhanhdeptrai@gmail.com';
        
        // 1. Xóa tài khoản cũ nếu có
        await User.destroy({ where: { email: targetEmail }, cascade: true });
        console.log(`Deleted old user with email ${targetEmail} (if existed).`);

        // 2. Tạo User Nguyễn Văn Khánh
        const hashedPassword = await bcrypt.hash('123456', 10);
        const user = await User.create({
            fullName: 'Nguyễn Văn Khánh',
            email: targetEmail,
            password: hashedPassword,
            gender: 'male',
            birthDate: '2001-05-30', // ~ 25 tuổi
            height: 175,
            weight: 80, // BMI ~26.1 -> Thừa cân
            activityLevel: 'sedentary', // TDEE tĩnh = BMR * 1.2
            goal: 'lose_weight', // TDEE - 500
            isOnboarded: true,
            waterGoal: 2800,
            useAdaptiveTDEE: true,
        });

        console.log(`Created user: ${user.email} (id: ${user.id})`);

        // 3. Tạo 18 Food
        const foodsData = [
            // Sáng (5)
            { name: 'Bánh mì ốp la', unit: '1 ổ', calories: 380, protein: 14, carbs: 42, fat: 17, fiber: 2, sugar: 4, sodium: 650, category: 'banh' },
            { name: 'Xôi xéo mỡ hành', unit: '1 gói', calories: 450, protein: 10, carbs: 75, fat: 15, fiber: 1, sugar: 3, sodium: 350, category: 'com' },
            { name: 'Phở gà', unit: '1 tô', calories: 400, protein: 25, carbs: 50, fat: 10, fiber: 1, sugar: 3, sodium: 1500, category: 'pho_bun' },
            { name: 'Bánh cuốn chả', unit: '1 đĩa', calories: 350, protein: 12, carbs: 48, fat: 12, fiber: 1, sugar: 2, sodium: 800, category: 'banh' },
            { name: 'Cháo sườn', unit: '1 bát', calories: 280, protein: 14, carbs: 35, fat: 10, fiber: 1, sugar: 1, sodium: 900, category: 'com' },
            // Trưa (5)
            { name: 'Cơm tấm sườn bì', unit: '1 đĩa', calories: 550, protein: 25, carbs: 70, fat: 20, fiber: 2, sugar: 3, sodium: 900, category: 'com' },
            { name: 'Bún bò Huế', unit: '1 tô', calories: 520, protein: 22, carbs: 58, fat: 22, fiber: 2, sugar: 3, sodium: 1800, category: 'pho_bun' },
            { name: 'Mì tôm trứng', unit: '1 tô', calories: 450, protein: 12, carbs: 55, fat: 20, fiber: 2, sugar: 3, sodium: 1850, category: 'pho_bun' },
            { name: 'Cơm rang dưa bò', unit: '1 đĩa', calories: 600, protein: 20, carbs: 72, fat: 25, fiber: 2, sugar: 2, sodium: 1200, category: 'com' },
            { name: 'Hủ tiếu Nam Vang', unit: '1 tô', calories: 480, protein: 20, carbs: 58, fat: 18, fiber: 1, sugar: 3, sodium: 1600, category: 'pho_bun' },
            // Tối (4)
            { name: 'Cơm thịt kho trứng', unit: '1 dĩa', calories: 520, protein: 22, carbs: 65, fat: 20, fiber: 1, sugar: 5, sodium: 800, category: 'com' },
            { name: 'Bún chả Hà Nội', unit: '1 suất', calories: 550, protein: 20, carbs: 60, fat: 25, fiber: 2, sugar: 8, sodium: 700, category: 'pho_bun' },
            { name: 'Phở bò tái lăn', unit: '1 tô', calories: 550, protein: 28, carbs: 50, fat: 26, fiber: 1, sugar: 3, sodium: 1700, category: 'pho_bun' },
            { name: 'Cơm gà Hải Nam', unit: '1 suất', calories: 600, protein: 30, carbs: 70, fat: 22, fiber: 1, sugar: 2, sodium: 650, category: 'com' },
            // Đồ uống/Ăn vặt (4)
            { name: 'Trà sữa trân châu', unit: '1 ly', calories: 350, protein: 3, carbs: 55, fat: 12, fiber: 0, sugar: 42, sodium: 80, category: 'do_uong' },
            { name: 'Cà phê sữa đá', unit: '1 ly', calories: 120, protein: 2, carbs: 18, fat: 4, fiber: 0, sugar: 16, sodium: 30, category: 'do_uong' },
            { name: 'Bánh tráng trộn', unit: '1 gói', calories: 280, protein: 5, carbs: 38, fat: 12, fiber: 1, sugar: 3, sodium: 850, category: 'banh' },
            { name: 'Nước ngọt có ga', unit: '1 lon', calories: 140, protein: 0, carbs: 39, fat: 0, fiber: 0, sugar: 39, sodium: 45, category: 'do_uong' },
        ];

        const createdFoods = {};
        for (const f of foodsData) {
            const food = await Food.create({
                userId: user.id,
                name: f.name,
                unit: f.unit,
                calories: f.calories,
                protein: f.protein,
                carbs: f.carbs,
                fat: f.fat,
                fiber: f.fiber,
                sugar: f.sugar,
                sodium: f.sodium,
                category: f.category,
                isCustom: true,
                isVerified: true
            });
            createdFoods[f.name] = food;
        }
        console.log(`Created 18 custom foods.`);

        // 7 Mẫu ngày (sửa 'chieu' -> 'phu' để đúng enum mealType)
        const menuDays = [
            // Ngày 1
            [
                { mealType: 'sang', foodName: 'Phở gà' },
                { mealType: 'trua', foodName: 'Cơm tấm sườn bì' },
                { mealType: 'phu', foodName: 'Trà sữa trân châu' },
                { mealType: 'toi', foodName: 'Cơm thịt kho trứng' },
            ],
            // Ngày 2
            [
                { mealType: 'sang', foodName: 'Bánh mì ốp la' },
                { mealType: 'sang', foodName: 'Cà phê sữa đá' },
                { mealType: 'trua', foodName: 'Mì tôm trứng' },
                { mealType: 'toi', foodName: 'Bún chả Hà Nội' },
            ],
            // Ngày 3
            [
                { mealType: 'sang', foodName: 'Xôi xéo mỡ hành' },
                { mealType: 'trua', foodName: 'Bún bò Huế' },
                { mealType: 'phu', foodName: 'Nước ngọt có ga' },
                { mealType: 'toi', foodName: 'Phở bò tái lăn' },
            ],
            // Ngày 4
            [
                { mealType: 'sang', foodName: 'Bánh cuốn chả' },
                { mealType: 'trua', foodName: 'Cơm rang dưa bò' },
                { mealType: 'phu', foodName: 'Trà sữa trân châu' },
                { mealType: 'toi', foodName: 'Cơm gà Hải Nam' },
            ],
            // Ngày 5
            [
                { mealType: 'sang', foodName: 'Cháo sườn' },
                { mealType: 'trua', foodName: 'Hủ tiếu Nam Vang' },
                { mealType: 'phu', foodName: 'Bánh tráng trộn' },
                { mealType: 'phu', foodName: 'Cà phê sữa đá' },
                { mealType: 'toi', foodName: 'Cơm thịt kho trứng' },
            ],
            // Ngày 6
            [
                { mealType: 'sang', foodName: 'Bánh mì ốp la' },
                { mealType: 'trua', foodName: 'Bún bò Huế' },
                { mealType: 'phu', foodName: 'Trà sữa trân châu' },
                { mealType: 'toi', foodName: 'Bún chả Hà Nội' },
            ],
            // Ngày 7
            [
                { mealType: 'sang', foodName: 'Xôi xéo mỡ hành' },
                { mealType: 'sang', foodName: 'Cà phê sữa đá' },
                { mealType: 'trua', foodName: 'Mì tôm trứng' },
                { mealType: 'phu', foodName: 'Nước ngọt có ga' },
                { mealType: 'toi', foodName: 'Cơm gà Hải Nam' },
            ]
        ];

        // 4. Tạo 35 ngày dữ liệu
        // Start date is 34 days ago so that end date is today
        const totalDays = 35;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - (totalDays - 1));

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayIndex = i % 7;
            const dailyMenu = menuDays[dayIndex];

            // Insert DiaryEntries
            for (const item of dailyMenu) {
                const food = createdFoods[item.foodName];
                await DiaryEntry.create({
                    userId: user.id,
                    date: dateStr,
                    foodId: food.id,
                    mealType: item.mealType,
                    amount: 1, // 1 đơn vị (suất/ly)
                    unit: food.unit,
                    caloriesSnapshot: food.calories,
                    proteinSnapshot: food.protein,
                    carbsSnapshot: food.carbs,
                    fatSnapshot: food.fat,
                    fiberSnapshot: food.fiber,
                    sugarSnapshot: food.sugar,
                    sodiumSnapshot: food.sodium
                });
            }

            // Insert WaterLog
            await WaterLog.create({
                userId: user.id,
                date: dateStr,
                amount: 1000 // 1000ml fixed
            });

            // Insert WeightLog according to 5-week plan
            const week = Math.floor(i / 7) + 1; // 1 to 5
            let startWeight, endWeight;
            if (week === 1) { startWeight = 80.0; endWeight = 79.0; }
            else if (week === 2) { startWeight = 79.0; endWeight = 78.8; }
            else if (week === 3) { startWeight = 78.8; endWeight = 78.8; }
            else if (week === 4) { startWeight = 78.8; endWeight = 79.0; }
            else { startWeight = 79.0; endWeight = 79.3; } // week 5

            // Linear interpolation within the week
            const dayOfWeekIndex = i % 7; // 0 to 6
            const weightForDay = startWeight + ((endWeight - startWeight) / 6) * dayOfWeekIndex;
            
            await WeightLog.create({
                userId: user.id,
                date: dateStr,
                weight: parseFloat(weightForDay.toFixed(1))
            });

            // Update user weight at the end
            if (i === totalDays - 1) {
                await user.update({ weight: parseFloat(weightForDay.toFixed(1)) });
            }
        }

        console.log(`Created 35 days of DiaryEntry, WaterLog, and WeightLog.`);

        // 7. Gọi processWeeklyAdaptation cho 5 tuần
        if (processWeeklyAdaptation) {
            console.log('Calculating Adaptive TDEE history...');
            for (let w = 4; w >= 0; w--) { // 5 tuần, từ tuần -4 đến tuần hiện tại
                const wStart = new Date(endDate);
                wStart.setDate(wStart.getDate() - (w * 7 + wStart.getDay() - 1)); // Lùi về Monday của tuần đó
                const wEnd = new Date(wStart);
                wEnd.setDate(wStart.getDate() + 6); // Sunday
                
                const startStr = wStart.toISOString().split('T')[0];
                const endStr = wEnd.toISOString().split('T')[0];
                
                await processWeeklyAdaptation(user.id, startStr, endStr);
            }
        }

        console.log('--- SEED COMPLETED ---');
        console.log(`Email: ${targetEmail}`);
        console.log(`Pass: 123456`);
        console.log('Vui lòng kiểm tra báo cáo PDF để xác nhận các cảnh báo.');
        process.exit(0);

    } catch (err) {
        console.error('Seed Error:', err);
        process.exit(1);
    }
}

seedAdaptiveTDEE();
