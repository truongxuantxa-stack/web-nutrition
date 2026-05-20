require('dotenv').config();
const { User } = require('./models');
const adaptiveService = require('./services/adaptiveTDEE.service');

async function triggerAdaptive() {
    try {
        const email = 'vankhanh12@gmail.com';
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            console.error('❌ User not found');
            process.exit(1);
        }

        console.log(`✅ Tính toán TDEE cho user: ${user.fullName}`);

        // Tính ngày thứ 2 của tuần trước
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const lastMonday = new Date(d.setDate(diff));

        // Lấy 4 tuần gần nhất để đảm bảo sinh đủ ít nhất 2 logs cho TDEE thích ứng
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
            console.log(`⏳ Đang xử lý tuần: ${week.weekStart} -> ${week.weekEnd}...`);
            try {
                const log = await adaptiveService.processWeeklyAdaptation(user.id, week.weekStart, week.weekEnd);
                if (log) {
                    console.log(`   -> Trạng thái log: ${log.status}, Calculated TDEE: ${log.calculatedTDEE}`);
                }
            } catch (err) {
                console.error(`   ❌ Lỗi: ${err.message}`);
            }
        }

        const updatedUser = await User.findByPk(user.id);
        if (updatedUser.adaptiveTDEE) {
            console.log(`🎉 TDEE Thích ứng mới của bạn là: ${updatedUser.adaptiveTDEE} kcal`);
        } else {
            console.log(`⚠️ TDEE Thích ứng vẫn chưa được cập nhật. Xem lại log trạng thái.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

triggerAdaptive();
