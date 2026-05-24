'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
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
const adaptiveService = require('../services/adaptiveTDEE.service');

async function seed() {
    try {
        console.log('=== BẮT ĐẦU SEED MOCK DATA CHO TÀI KHOẢN TEST ADAPTIVE TDEE ===');

        // 1. Tìm hoặc tạo user adaptivedemo@gmail.com
        let user = await User.findOne({ where: { email: 'adaptivedemo@gmail.com' } });
        const hashedPassword = await bcrypt.hash('123456', 10);

        if (!user) {
            console.log('User adaptivedemo@gmail.com chưa tồn tại, tiến hành tạo mới...');
            user = await User.create({
                fullName: 'Demo TDEE Thích Ứng',
                email: 'adaptivedemo@gmail.com',
                password: hashedPassword,
                gender: 'male',
                birthDate: '2001-01-01',
                height: 175,
                weight: 80, // Cân nặng lúc onboarding ban đầu
                activityLevel: 'moderate', // x1.55
                goal: 'lose_weight',
                isOnboarded: true,
                waterGoal: 2800,
                adaptiveTDEE: null,
                useAdaptiveTDEE: true
            });
            console.log(`Đã tạo thành công User với ID: ${user.id}`);
        } else {
            console.log(`Đã tìm thấy User với ID: ${user.id}, tiến hành đặt lại dữ liệu...`);
            await user.update({
                fullName: 'Demo TDEE Thích Ứng',
                password: hashedPassword,
                gender: 'male',
                birthDate: '2001-01-01',
                height: 175,
                weight: 80,
                activityLevel: 'moderate',
                goal: 'lose_weight',
                isOnboarded: true,
                waterGoal: 2800,
                adaptiveTDEE: null,
                useAdaptiveTDEE: true
            });
        }

        const userId = user.id;

        // 2. Dọn sạch dữ liệu cũ để tránh trùng lặp
        console.log('Đang xóa sạch dữ liệu nhật ký cũ của user này...');
        await DiaryEntry.destroy({ where: { userId } });
        await WeightLog.destroy({ where: { userId } });
        await ExerciseLog.destroy({ where: { userId } });
        await WaterLog.destroy({ where: { userId } });
        await AdaptiveTDEELog.destroy({ where: { userId } });
        console.log('Đã dọn dẹp xong dữ liệu cũ.');

        // 3. Lấy thực phẩm từ database làm nguồn sinh thực đơn
        const allFoods = await Food.findAll();
        if (allFoods.length === 0) {
            throw new Error('Database chưa có thực phẩm! Vui lòng chạy seed thực phẩm trước.');
        }
        console.log(`Đã lấy thành công ${allFoods.length} thực phẩm từ DB.`);

        // Phân loại thực phẩm để sinh bữa ăn đẹp mắt
        const breakfastFoods = allFoods.filter(f => 
            f.category === 'banh' || f.category === 'do_uong' || f.category === 'pho_bun' ||
            f.name.toLowerCase().includes('bánh') || f.name.toLowerCase().includes('sữa') || f.name.toLowerCase().includes('phở')
        );
        const mainFoods = allFoods.filter(f => 
            f.category === 'com' || f.category === 'thit_ca' || f.category === 'rau_cu'
        );
        const snackFoods = allFoods.filter(f => 
            f.category === 'trai_cay' || f.category === 'banh' || f.category === 'do_uong'
        );

        const getBfFood = () => breakfastFoods.length > 0 ? breakfastFoods[Math.floor(Math.random() * breakfastFoods.length)] : allFoods[Math.floor(Math.random() * allFoods.length)];
        const getMainFood = () => mainFoods.length > 0 ? mainFoods[Math.floor(Math.random() * mainFoods.length)] : allFoods[Math.floor(Math.random() * allFoods.length)];
        const getSnackFood = () => snackFoods.length > 0 ? snackFoods[Math.floor(Math.random() * snackFoods.length)] : allFoods[Math.floor(Math.random() * allFoods.length)];

        // 4. Tính toán các mốc thời gian tuần
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const lastMonday = new Date(d.setDate(diff));

        // 4 tuần gần nhất
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

        console.log('4 tuần kiểm thử được thiết lập:');
        weeks.forEach((w, idx) => {
            console.log(`  - Tuần ${idx + 1}: ${w.weekStart} -> ${w.weekEnd}`);
        });

        const firstWeekStart = new Date(weeks[0].weekStart);
        const warmUpStart = new Date(firstWeekStart);
        warmUpStart.setDate(warmUpStart.getDate() - 14); // Lùi 14 ngày làm ấm EMA cân nặng

        const t_warmup = new Date(warmUpStart);
        const t_week1 = new Date(weeks[0].weekStart);
        const t_week2 = new Date(weeks[1].weekStart);
        const t_week3 = new Date(weeks[2].weekStart);
        const t_week4 = new Date(weeks[3].weekStart);
        const t_post_week4 = new Date(weeks[3].weekEnd);
        t_post_week4.setDate(t_post_week4.getDate() + 1);

        const weightLogsToCreate = [];
        const diaryEntriesToCreate = [];
        const waterLogsToCreate = [];
        const exerciseLogsToCreate = [];

        // 5. Vòng lặp sinh dữ liệu hàng ngày
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        let current = new Date(warmUpStart);
        
        console.log(`Sinh dữ liệu từ ngày bắt đầu warm-up: ${warmUpStart.toISOString().split('T')[0]} đến hôm nay: ${todayStr}`);

        while (current <= today) {
            const dateStr = current.toISOString().split('T')[0];

            // A. CÂN NẶNG (Kịch bản chững cân)
            let weight = 80.0;
            const timeDiff = current - t_warmup;
            const diffDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            if (current < t_week1) {
                // Giai đoạn Warm-up (14 ngày): Giảm từ 81.0kg xuống 80.0kg
                const daysInStage = Math.floor((current - t_warmup) / (1000 * 60 * 60 * 24));
                weight = 81.0 - (daysInStage / 14) * 1.0;
            } else if (current >= t_week1 && current < t_week2) {
                // Tuần 1: Giảm nhanh từ 80.0kg xuống 79.0kg (Giảm 1.0kg)
                const daysInStage = Math.floor((current - t_week1) / (1000 * 60 * 60 * 24));
                weight = 80.0 - (daysInStage / 7) * 1.0;
            } else if (current >= t_week2 && current < t_week3) {
                // Tuần 2: Giảm chậm lại từ 79.0kg xuống 78.4kg (Giảm 0.6kg)
                const daysInStage = Math.floor((current - t_week2) / (1000 * 60 * 60 * 24));
                weight = 79.0 - (daysInStage / 7) * 0.6;
            } else if (current >= t_week3 && current < t_week4) {
                // Tuần 3: Giảm rất chậm từ 78.4kg xuống 78.1kg (Giảm 0.3kg) - Bắt đầu thích ứng
                const daysInStage = Math.floor((current - t_week3) / (1000 * 60 * 60 * 24));
                weight = 78.4 - (daysInStage / 7) * 0.3;
            } else if (current >= t_week4 && current < t_post_week4) {
                // Tuần 4: Chững cân gần như hoàn toàn từ 78.1kg xuống 78.0kg (Giảm 0.1kg)
                const daysInStage = Math.floor((current - t_week4) / (1000 * 60 * 60 * 24));
                weight = 78.1 - (daysInStage / 7) * 0.1;
            } else {
                // Sau tuần 4: Dao động nhẹ quanh 78.0kg
                weight = 78.0;
            }

            // Thêm dao động cực nhỏ để tạo cảm giác tự nhiên của cân điện tử (±0.02 kg)
            weight += (Math.random() * 0.04 - 0.02);
            weight = Math.round(weight * 100) / 100;

            weightLogsToCreate.push({
                userId,
                weight,
                date: dateStr,
                note: dateStr === warmUpStart.toISOString().split('T')[0] ? 'Bắt đầu warm-up' : null
            });

            // B. NƯỚC UỐNG
            // Mục tiêu nước: 2800 ml. Sinh 3 lần uống mỗi ngày.
            waterLogsToCreate.push(
                { userId, amount: 800, date: dateStr, note: 'Sáng ngủ dậy' },
                { userId, amount: 1000, date: dateStr, note: 'Chiều' },
                { userId, amount: 1000, date: dateStr, note: 'Tối trước khi ngủ' }
            );

            // C. LUYỆN TẬP
            // Ghi nhận luyện tập vào Thứ 2, Thứ 4, Thứ 6
            const dayOfWeek = current.getDay(); // 0: CN, 1: T2, ..., 6: T7
            if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
                exerciseLogsToCreate.push({
                    userId,
                    sport: 'running',
                    duration: 30,
                    caloriesBurned: 300,
                    date: dateStr
                });
            }

            // D. NHẬT KÝ ĂN UỐNG (Chỉ seed từ Tuần 1 trở đi)
            if (current >= t_week1) {
                // Mục tiêu: Nạp chính xác ~2200 kcal mỗi ngày
                // Bữa sáng: ~450 kcal | Bữa trưa: ~750 kcal | Bữa tối: ~750 kcal | Bữa phụ: ~250 kcal
                
                // Bữa sáng (~450 kcal)
                const bfFood = getBfFood();
                const bfAmount = Math.round((450 / bfFood.calories) * 100) / 100;
                addDiaryEntry('sang', bfFood, bfAmount, dateStr);

                // Bữa trưa (~750 kcal)
                const lunchFood = getMainFood();
                const lunchAmount = Math.round((750 / lunchFood.calories) * 100) / 100;
                addDiaryEntry('trua', lunchFood, lunchAmount, dateStr);

                // Bữa tối (~750 kcal)
                const dinnerFood = getMainFood();
                const dinnerAmount = Math.round((750 / dinnerFood.calories) * 100) / 100;
                addDiaryEntry('toi', dinnerFood, dinnerAmount, dateStr);

                // Bữa phụ (~250 kcal)
                const snackFood = getSnackFood();
                const snackAmount = Math.round((250 / snackFood.calories) * 100) / 100;
                addDiaryEntry('phu', snackFood, snackAmount, dateStr);
            }

            // Tăng thêm 1 ngày
            current.setDate(current.getDate() + 1);
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
                note: 'Seed Adaptive TDEE'
            });
        }

        // 6. Bulk Create dữ liệu
        console.log(`⏳ Đang tạo ${weightLogsToCreate.length} bản ghi Cân nặng...`);
        await WeightLog.bulkCreate(weightLogsToCreate);

        console.log(`⏳ Đang tạo ${waterLogsToCreate.length} bản ghi Nước uống...`);
        await WaterLog.bulkCreate(waterLogsToCreate);

        console.log(`⏳ Đang tạo ${exerciseLogsToCreate.length} bản ghi Luyện tập...`);
        await ExerciseLog.bulkCreate(exerciseLogsToCreate);

        console.log(`⏳ Đang tạo ${diaryEntriesToCreate.length} bản ghi Nhật ký ăn uống...`);
        await DiaryEntry.bulkCreate(diaryEntriesToCreate);

        console.log('🎉 Seed dữ liệu thô thành công!');

        // 7. Kích hoạt tính toán Adaptive TDEE cho từng tuần
        console.log('⏳ Tiến hành chạy tính toán Adaptive TDEE cho 4 tuần gần nhất...');
        
        for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            console.log(`  -> Tính toán Tuần ${i + 1}: ${week.weekStart} -> ${week.weekEnd}...`);
            
            const log = await adaptiveService.processWeeklyAdaptation(userId, week.weekStart, week.weekEnd);
            if (log) {
                console.log(`     [KẾT QUẢ] Trạng thái: ${log.status}`);
                console.log(`     Lượng calo ăn trung bình: ${Math.round(log.avgDailyIntake)} kcal`);
                console.log(`     Cân nặng đầu tuần: ${log.startWeight} kg | Cuối tuần: ${log.endWeight} kg (Delta: ${log.weightDelta} kg)`);
                console.log(`     Calculated TDEE: ${Math.round(log.calculatedTDEE)} kcal`);
                console.log(`     Rolling TDEE (Áp dụng): ${Math.round(log.rollingTDEE)} kcal`);
            }
        }

        // 8. Đọc lại thông tin User đã được cập nhật
        const updatedUser = await User.findByPk(userId);
        console.log('\n=== KẾT QUẢ CUỐI CÙNG SAU KHI TÍNH TOÁN ===');
        console.log(`Họ tên: ${updatedUser.fullName}`);
        console.log(`Email: ${updatedUser.email} (Mật khẩu: 123456)`);
        console.log(`Cân nặng hiện tại: ${updatedUser.weight} kg`);
        console.log(`TDEE Tĩnh (Mifflin-St Jeor): 2749 kcal`);
        console.log(`TDEE Thích ứng đã cập nhật (User.adaptiveTDEE): ${Math.round(updatedUser.adaptiveTDEE)} kcal`);
        
        const changePercent = ((updatedUser.adaptiveTDEE - 2749) / 2749 * 100).toFixed(1);
        console.log(`Mức độ thay đổi so với TDEE tĩnh: ${changePercent}%`);
        console.log('=====================================================');

        console.log('🎉 QUÁ TRÌNH SEED DỮ LIỆU VÀ TÍNH TOÁN HOÀN THÀNH MỸ MÃN!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Lỗi trong quá trình seed dữ liệu:', error);
        process.exit(1);
    }
}

seed();
