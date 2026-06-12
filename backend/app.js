require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const app = express();

// Gỡ bỏ EJS view engine để chuyển sang React SPA hoàn toàn

// ─── Middlewares ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' })); // Nâng limit cho base64 image (AI Vision Scanner)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Serve React SPA (Production Build) ────────────────────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

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

// ─── EJS Routes (DISABLED — React SPA thay thế) ────────────
// const routes = require('./routes');
// app.use('/', routes);

// ─── Strict API 404 ────────────────────────────────────────
// Mọi request /api/* không match route nào → trả JSON 404
// (Tránh React SPA nhận HTML thay vì JSON khi gọi sai endpoint)
app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint không tồn tại.' });
});

// ─── SPA Fallback ──────────────────────────────────────────
// Chỉ serve index.html cho browser navigation (HTML requests)
// Tránh trả HTML cho missing static assets (ảnh, CSS, JS)
app.get('*', (req, res) => {
    if (req.accepts('html')) {
        return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    res.status(404).json({ success: false, message: 'Not found.' });
});

// ─── Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
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
