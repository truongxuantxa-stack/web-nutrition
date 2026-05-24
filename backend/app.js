require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const app = express();

// ─── View Engine ───────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middlewares ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ─── CORS (chỉ bật ở Production — dev dùng Vite Proxy) ─────
if (process.env.NODE_ENV === 'production') {
    app.use('/api', cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    }));
}

// ─── API Response Helper ────────────────────────────────────
// Gắn res.success / res.error / res.validationError cho mọi /api/* request
const apiResponse = require('./middlewares/apiResponse');
app.use('/api', apiResponse);

// ─── API Routes (/api/v1/*) ─────────────────────────────────
const apiRoutes = require('./routes/api');
app.use('/api/v1', apiRoutes);

// ─── EJS Routes (/) ─────────────────────────────────────────
const routes = require('./routes');
app.use('/', routes);

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'Endpoint không tồn tại.' });
    }
    res.status(404).render('404', { title: 'Không tìm thấy trang' });
});

// ─── Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    // API request → luôn trả JSON
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
    // EJS request → trả HTML error page
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
    res.status(500).render('404', { title: 'Lỗi Hệ Thống' });
});

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);

    // Kết nối và sync database
    try {
        const { sequelize } = require('./models');
        await sequelize.authenticate();
        console.log('✅ Kết nối MySQL thành công!');
        // sync({ alter: true }) để cập nhật schema mà không mất dữ liệu
        await sequelize.sync({ alter: true });
        console.log('✅ Database đã được đồng bộ!');

        // Khởi động Cron Jobs
        const adaptiveCron = require('./cron/adaptive.cron');
        adaptiveCron.startCronJobs();
        console.log('✅ Đã khởi động Cron Jobs (Adaptive TDEE)');
    } catch (error) {
        console.error('❌ Lỗi kết nối Database:', error.message);
    }
});

module.exports = app;
