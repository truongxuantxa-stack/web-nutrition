require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Food, DiaryEntry, WeightLog, WaterLog, ExerciseLog, AdaptiveTDEELog } = require('../models');
const adaptiveService = require('../services/adaptiveTDEE.service');

async function seedAdaptiveTestUser() {
    try {
        await sequelize.authenticate();
        console.log('✅ Kết nối thành công đến cơ sở dữ liệu.');

        const email = 'testtdee@gmail.com';

        // 1. Kiểm tra và dọn dẹp user cũ nếu tồn tại
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            console.log(`⏳ Phát hiện tài khoản test cũ (ID: ${existingUser.id}). Đang xóa để làm mới dữ liệu...`);
            // Do associations được cấu hình ON DELETE CASCADE, toàn bộ các bản ghi liên quan (weight, water, diary, exercise, adaptive log) sẽ được dọn dẹp sạch sẽ!
            await existingUser.destroy();
            console.log('✅ Đã xóa sạch dữ liệu cũ thành công.');
        }

        // 2. Tạo User test mới
        console.log('⏳ Đang tạo tài khoản test mới...');
        const hashedPassword = await bcrypt.hash('123456', 12);
        const user = await User.create({
            fullName: 'Nguyễn Thích Ứng',
            email: email,
            password: hashedPassword,
            gender: 'male',
            birthDate: '1998-05-25', // 28 tuổi
            height: 172,
            weight: 75,
            activityLevel: 'moderate',
            goal: 'lose_weight',
            isOnboarded: true,
            useAdaptiveTDEE: true,
            macroProtein: 30,
            macroCarbs: 40,
            macroFat: 30,
            waterGoal: 2600
        });
        console.log(`✅ Đã tạo user mới thành công: ${user.fullName} (ID: ${user.id})`);

        // 3. Khởi tạo danh sách thực phẩm mẫu phong phú
        console.log('⏳ Đang khởi tạo các món ăn mẫu phong phú...');
        const foodsData = [
            {
                name: 'Phở Bò Truyền Thống',
                calories: 550, protein: 30, carbs: 65, fat: 15, fiber: 3, sugar: 4, sodium: 1200,
                unit: 'bát', category: 'pho_bun', foodType: 'dish', isSuggestable: true, isCustom: false
            },
            {
                name: 'Cơm Ức Gà Bông Cải Xanh',
                calories: 600, protein: 45, carbs: 60, fat: 12, fiber: 5, sugar: 2, sodium: 600,
                unit: 'đĩa', category: 'com', foodType: 'dish', isSuggestable: true, isCustom: false
            },
            {
                name: 'Trứng Ốp La Bánh Mì',
                calories: 450, protein: 20, carbs: 45, fat: 18, fiber: 2, sugar: 3, sodium: 500,
                unit: 'phần', category: 'banh', foodType: 'dish', isSuggestable: true, isCustom: false
            },
            {
                name: 'Whey Protein & Chuối',
                calories: 300, protein: 30, carbs: 35, fat: 3, fiber: 4, sugar: 12, sodium: 150,
                unit: 'ly', category: 'do_uong', foodType: 'dish', isSuggestable: true, isCustom: false
            },
            {
                name: 'Salad Cá Hồi Quả Bơ',
                calories: 500, protein: 28, carbs: 15, fat: 35, fiber: 6, sugar: 2, sodium: 400,
                unit: 'đĩa', category: 'rau_cu', foodType: 'dish', isSuggestable: true, isCustom: false
            }
        ];

        const createdFoods = [];
        for (const foodInfo of foodsData) {
            const [food] = await Food.findOrCreate({
                where: { name: foodInfo.name },
                defaults: foodInfo
            });
            createdFoods.push(food);
        }
        console.log(`✅ Đã chuẩn bị ${createdFoods.length} thực phẩm mẫu.`);

        // 4. Sinh dữ liệu mượt mà trong 45 ngày qua
        console.log('⏳ Đang sinh dữ liệu 45 ngày qua (cân nặng, ăn uống, tập luyện, nước)...');
        const weights = [];
        const waters = [];
        const exercises = [];
        const entries = [];

        // Dữ liệu sẽ trải rộng từ 45 ngày trước cho tới hôm nay
        for (let i = 45; i >= 1; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // --- Sinh Cân Nặng (Giảm đều từ 75kg về ~70kg trong 45 ngày) ---
            const progress = (45 - i) / 45; // chạy từ 0 đến 1
            const baseWeight = 75 - progress * 5; // giảm dần từ 75 về 70
            // Thêm dao động sinh học hình sin + ngẫu nhiên để biểu đồ cực kỳ chân thực
            const fluctuation = Math.sin(i * 0.8) * 0.15 + (Math.random() - 0.5) * 0.08;
            const currentWeight = Math.round((baseWeight + fluctuation) * 100) / 100;

            weights.push({
                userId: user.id,
                weight: currentWeight,
                date: dateStr,
                note: 'Cân đo buổi sáng sau khi ngủ dậy.'
            });

            // --- Sinh Nước Uống (2100ml - 2800ml mỗi ngày) ---
            const waterAmount = 2100 + Math.floor(Math.random() * 700);
            waters.push({
                userId: user.id,
                amount: waterAmount,
                date: dateStr,
                note: 'Uống nước lọc đều đặn.'
            });

            // --- Sinh Tập Luyện (5 ngày một tuần: thứ 2 đến thứ 6) ---
            if (i % 7 < 5) {
                const sportOptions = [
                    { sport: 'running', duration: 40, caloriesBurned: 380 },
                    { sport: 'cycling', duration: 45, caloriesBurned: 320 },
                    { sport: 'swimming', duration: 30, caloriesBurned: 350 },
                    { sport: 'weightlifting', duration: 60, caloriesBurned: 300 }
                ];
                const sportChoice = sportOptions[i % sportOptions.length];
                exercises.push({
                    userId: user.id,
                    sport: sportChoice.sport,
                    duration: sportChoice.duration,
                    caloriesBurned: sportChoice.caloriesBurned,
                    date: dateStr
                });
            }

            // --- Sinh Nhật Ký Ăn Uống (4 bữa chuẩn với calo intake ~2000-2100 kcal) ---
            const meals = [
                { type: 'sang', food: createdFoods[2] }, // Trứng ốp la bánh mì (450 kcal)
                { type: 'trua', food: createdFoods[1] }, // Cơm ức gà bông cải xanh (600 kcal)
                { type: 'toi', food: createdFoods[4] },  // Salad cá hồi quả bơ (500 kcal)
                { type: 'phu', food: createdFoods[3] }   // Whey Protein & Chuối (300 kcal)
            ];

            // Cho scale dao động nhẹ từ 0.9 đến 1.12 để calo nạp thay đổi nhẹ mỗi ngày
            meals.forEach(meal => {
                const scale = 0.9 + (Math.random() * 0.22);
                const roundedScale = Math.round(scale * 100) / 100;

                entries.push({
                    userId: user.id,
                    foodId: meal.food.id,
                    amount: roundedScale,
                    mealType: meal.type,
                    date: dateStr,
                    caloriesSnapshot: Math.round(meal.food.calories * roundedScale),
                    proteinSnapshot: Math.round(meal.food.protein * roundedScale * 10) / 10,
                    carbsSnapshot: Math.round(meal.food.carbs * roundedScale * 10) / 10,
                    fatSnapshot: Math.round(meal.food.fat * roundedScale * 10) / 10,
                    note: 'Dinh dưỡng tiêu chuẩn theo chế độ ăn.'
                });
            });
        }

        console.log('⏳ Đang lưu dữ liệu Cân Nặng vào database...');
        await WeightLog.bulkCreate(weights, { ignoreDuplicates: true });

        console.log('⏳ Đang lưu dữ liệu Nước Uống vào database...');
        await WaterLog.bulkCreate(waters, { ignoreDuplicates: true });

        console.log('⏳ Đang lưu dữ liệu Tập Luyện vào database...');
        await ExerciseLog.bulkCreate(exercises, { ignoreDuplicates: true });

        console.log('⏳ Đang lưu dữ liệu Nhật Ký Ăn Uống vào database...');
        await DiaryEntry.bulkCreate(entries, { ignoreDuplicates: true });

        console.log('✅ Sinh dữ liệu 45 ngày thành công!');

        // 5. Tính toán Adaptive TDEE cho 4 tuần gần nhất
        console.log('⏳ Bắt đầu tính toán thuật toán Adaptive TDEE cho 4 tuần gần nhất...');

        // Tính ngày thứ 2 của tuần trước
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const lastMonday = new Date(d.setDate(diff));

        // Lấy danh sách 4 tuần gần nhất
        const weeks = [];
        for (let i = 3; i >= 0; i--) {
            const weekMonday = new Date(lastMonday);
            weekMonday.setDate(weekMonday.getDate() - (i * 7));
            const weekStart = weekMonday.toISOString().split('T')[0];
            const weekEndDate = new Date(weekMonday);
            weekEndDate.setDate(weekEndDate.getDate() + 6);
            const weekEnd = weekEndDate.toISOString().split('T')[0];
            weeks.push({ weekStart, weekEnd });
        }

        for (const week of weeks) {
            console.log(`   ⏳ Đang chạy Adaptive TDEE cho tuần: ${week.weekStart} -> ${week.weekEnd}...`);
            const log = await adaptiveService.processWeeklyAdaptation(user.id, week.weekStart, week.weekEnd);
            if (log) {
                console.log(`      -> Trạng thái: ${log.status}, Calo nạp TB: ${Math.round(log.avgDailyIntake)} kcal, Δ Cân nặng: ${log.weightDelta.toFixed(2)} kg, TDEE thích ứng: ${Math.round(log.rollingTDEE)} kcal`);
            }
        }

        // Kiểm tra kết quả cuối cùng của User
        const updatedUser = await User.findByPk(user.id);
        console.log('\n======================================================');
        console.log('🎉 QUÁ TRÌNH SINH DỮ LIỆU HOÀN TẤT THÀNH CÔNG!');
        console.log(`👤 Tài khoản: ${updatedUser.fullName}`);
        console.log(`📧 Email đăng nhập: ${updatedUser.email}`);
        console.log(`🔑 Mật khẩu: 123456`);
        console.log(`⚖️ Cân nặng hiện tại: ${updatedUser.weight} kg`);
        console.log(`📈 TDEE Thích ứng tính toán thành công: ${Math.round(updatedUser.adaptiveTDEE)} kcal (TDEE Tĩnh: ~2620 kcal)`);
        console.log('======================================================\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi trong quá trình sinh dữ liệu:', error);
        process.exit(1);
    }
}

seedAdaptiveTestUser();
