const cron = require('node-cron');
const { User } = require('../models');
const adaptiveService = require('../services/adaptiveTDEE.service');

// Lấy ngày Thứ Hai của tuần trước
const getPreviousWeekStart = () => {
    const d = new Date();
    // Lùi lại 7 ngày để lấy ngày của tuần trước
    d.setDate(d.getDate() - 7);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh khi ngày chủ nhật là 0
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
};

const getWeekEnd = (weekStart) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
};

// Chạy vào 00:00 mỗi sáng Thứ 2 (0 0 * * 1)
const startCronJobs = () => {
    cron.schedule('0 0 * * 1', async () => {
        console.log('--- CRON JOB: Chạy thuật toán Adaptive TDEE cho tuần trước ---');
        try {
            // Lấy danh sách tất cả user đang bật Adaptive TDEE
            const users = await User.findAll({
                where: { useAdaptiveTDEE: true }
            });

            if (users.length === 0) {
                console.log('Không có user nào bật Adaptive TDEE. Bỏ qua.');
                return;
            }

            const weekStart = getPreviousWeekStart();
            const weekEnd = getWeekEnd(weekStart);
            console.log(`Bắt đầu tính toán cho tuần: ${weekStart} đến ${weekEnd}`);

            let countSuccess = 0;
            let countFailed = 0;

            for (const user of users) {
                try {
                    await adaptiveService.processWeeklyAdaptation(user.id, weekStart, weekEnd);
                    countSuccess++;
                } catch (err) {
                    console.error(`Lỗi khi xử lý Adaptive TDEE cho user ${user.id}:`, err);
                    countFailed++;
                }
            }

            console.log(`Hoàn thành Cron Job Adaptive TDEE: ${countSuccess} thành công, ${countFailed} thất bại.`);
        } catch (error) {
            console.error('Lỗi nghiêm trọng trong Cron Job Adaptive TDEE:', error);
        }
    });
};

module.exports = { startCronJobs };
